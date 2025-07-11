import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import { userService } from '../services/userService';
import '../config/passport';
import jwt from "jsonwebtoken"
import multer from 'multer';
import { Client, Storage, ID } from 'appwrite';
import { InputFile } from 'node-appwrite/file';
import { prisma } from '@audiobook/db/client';

dotenv.config();


const app = express();
const JWT_SECRET: string = process.env.JWT_SECRET!
const JWT_EXPIRY = "1h"
const client = new Client().setEndpoint(process.env.PROJECT_ENDPOINT!).setProject(process.env.PROJECT_ID!)
const storage = new Storage(client)

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});

const generateTokenForUser = (user: { id: any; email: any; name: any; }) => {
    const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        // Add any other user info you need
        iat: Math.floor(Date.now() / 1000), // Issued at time
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Middleware to verify JWT token
const verifyToken = (req: any, res: any, next: () => void) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};


// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Auth Routes
app.get('/auth/google', (req, res, next) => {
    try {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
        })(req, res, next);
    } catch (error) {
        next(error); // Pass errors to error-handling middleware
    }
});

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/` }),
    (req: any, res) => {
        const token = generateTokenForUser(req.user)
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        });
        console.log('OAuth callback successful, redirecting to home');
        res.redirect(`${process.env.CLIENT_URL}/`);
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect(process.env.CLIENT_URL!);
    });
});

// API Routes
app.get('/api/user', (req: any, res) => {
    if (req.isAuthenticated()) {
        // Generate a fresh token for API calls
        const apiToken = generateTokenForUser(req.user);

        res.json({
            ...req.user._doc, // User data
            apiToken, // Token for API calls to Flask backend
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});


app.get('/api/getaudiobooks', verifyToken, async (req: any, res) => {
    try {
        const audioBooks = await prisma.audioBook.findMany({
            where: {
                userId: req.user.userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Generate download URLs for each audiobook
        const audioBooksWithUrls = await Promise.all(
            audioBooks.map(async (book) => {
                try {
                    // Generate a temporary download URL (valid for 1 hour)
                    const downloadUrl = await storage.getFileDownload(process.env.BUCKET_ID!, book.fileId);
                    console.log("Download url:", downloadUrl)
                    return {
                        ...book,
                        audioUrl: downloadUrl
                    };
                } catch (error) {
                    console.error(`Error getting download URL for file ${book.fileId}:`, error);
                    return {
                        ...book,
                        audioUrl: null
                    };
                }
            })
        );
        console.log(audioBooksWithUrls)
        res.json(audioBooksWithUrls);
    } catch (error) {
        console.error('Error fetching audiobooks:', error);
        res.status(500).json({ error: 'Failed to fetch audiobooks' });
    }
});

// Store generated audiobook
app.post('/api/createAudioBook', verifyToken, upload.single('audioFile'), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        console.log("Red file:", req.file)
        
        const { title, originalFileName } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const buffer = req.file.buffer
        const fileId = ID.unique();

        const fileName = `${fileId}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.wav`;
        const inputFile = InputFile.fromBuffer(buffer, fileName);
        console.log("Input File: ", inputFile)

        // Upload file to Appwrite Storage

        const uploadedFile = await storage.createFile(
            process.env.BUCKET_ID!,
            fileId,
            inputFile
        );

        // Save audiobook metadata to database
        const audioBook = await prisma.audioBook.create({
            data: {
                title,
                fileId: uploadedFile.$id,
                fileUrl: null, // We'll generate this dynamically
                userId: req.user.userId,
                originalFileName
            }
        });

        // Generate download URL for immediate use
        const downloadUrl = await storage.getFileDownload(process.env.BUCKET_ID!, uploadedFile.$id);
        // console.log(downloadUrl)
        res.json({
            ...audioBook,
            audioUrl: downloadUrl,
        });

    } catch (error) {
        console.error('Error storing audiobook:', error);
        res.status(500).json({ error: 'Failed to store audiobook' });
    }
});

// Delete audiobook
app.delete('/api/audiobooks/:id', verifyToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Find the audiobook
        const audioBook = await prisma.audioBook.findFirst({
            where: {
                fileId: id,
                userId: req.user.userId
            }
        });

        if (!audioBook) {
            return res.status(404).json({ error: 'Audiobook not found' });
        }

        // Delete from Appwrite Storage
        try {
            await storage.deleteFile(process.env.BUCKET_ID!, audioBook.fileId);
        } catch (storageError) {
            console.error('Error deleting from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
        }

        // Delete from database
        await prisma.audioBook.delete({
            where: { id: audioBook.id }
        });

        res.json({ message: 'Audiobook deleted successfully' });

    } catch (error) {
        console.error('Error deleting audiobook:', error);
        res.status(500).json({ error: 'Failed to delete audiobook' });
    }
});

// Get download URL for a specific audiobook
app.get('/api/audiobooks/:id/download', verifyToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const audioBook = await prisma.audioBook.findFirst({
            where: {
                fileId: id,
                userId: req.user.userId
            }
        });

        if (!audioBook) {
            return res.status(404).json({ error: 'Audiobook not found' });
        }
        const fileName = `${audioBook.title.replace(/[^a-zA-Z0-9]/g, '_')}_audiobook.wav`;
        const downloadUrl = await storage.getFileDownload(process.env.BUCKET_ID!, audioBook.fileId);
        res.set({
            'Content-Type': 'audio/wav',
            'Content-Disposition': `attachment; filename="${fileName}"`
        });
        res.json({
            downloadUrl: downloadUrl,
            fileName: fileName
        });

    } catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});


// Get all users (for admin/debugging)
app.get('/api/users', async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/refresh-token', (req: any, res) => {
    if (req.isAuthenticated()) {
        const token = generateTokenForUser(req.user);
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }

        // Clear the auth cookie
        res.clearCookie('authToken');
        res.redirect(process.env.CLIENT_URL!);
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Client URL: ${process.env.CLIENT_URL}`);
});