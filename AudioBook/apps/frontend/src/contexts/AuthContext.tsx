import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types/user';
import axios, { type AxiosResponse } from 'axios';
import type { AudioBook } from '../types';
import dotenv from 'dotenv';

dotenv.config()

interface ExtendedUser extends User {
    apiToken?: string;
}

interface ExtendedAuthContextType extends Omit<AuthContextType, 'user'> {
    user: ExtendedUser | null;
    apiToken: string | null;
    audioBooks: AudioBook[];
    makeAuthenticatedFormRequest: (url: string, formData: FormData) => Promise<AxiosResponse<Blob>>;
    fetchAudioBooks: () => Promise<void>;
    storeAudioBook: (audioBlob: Blob, title: string, originalFileName: string) => Promise<AudioBook>;
    deleteAudioBook: (id: string) => Promise<AudioBook[]>;
    getDownloadUrl: (id: string) => any;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiToken, setApiToken] = useState<string | null>(null);
    const [audioBooks, setAudioBooks] = useState<AudioBook[]>([])

    useEffect(() => {
        checkAuthStatus();
    }, []);


    useEffect(() => {
        if (user && apiToken) {
            fetchAudioBooks();
        }
    }, [user, apiToken]);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${process.env.VITE_API_URL}/api/user`, {
                credentials: 'include',
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setApiToken(userData.apiToken || null);
            }
            console.log('Auth checked');
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        try {
            const response = await fetch(`${process.env.VITE_API_URL}/api/refresh-token`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setApiToken(data.token);
                return data.token;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return null;
    };


    const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
        let token = apiToken;

        if (!token) {
            token = await refreshToken();
            if (!token) {
                throw new Error('No authentication token available');
            }
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                const newToken = await refreshToken();
                if (newToken) {
                    return fetch(url, {
                        ...options,
                        headers: {
                            ...options.headers,
                            Authorization: `Bearer ${newToken}`,
                        },
                    });
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    const makeAuthenticatedFormRequest = async (url: string, formData: FormData): Promise<AxiosResponse<Blob>> => {
        let token = apiToken;
        console.log('Making request with token:', token);

        if (!token) {
            console.log('No token, refreshing...');
            token = await refreshToken();
            console.log('New token:', token);
            if (!token) {
                throw new Error('No authentication token available');
            }
        }

        try {
            console.log('Sending request to:', url);
            const response = await axios.post(url, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
                timeout: 300000,
            });
            console.log('Request successful:', response.status);
            return response;
        } catch (error: any) {
            console.error('Request failed:', error.response?.status);
            if (error.response?.status === 401) {
                console.log('Retrying with new token...');
                const newToken = await refreshToken();
                if (newToken) {
                    const retryResponse = await axios.post(url, formData, {
                        headers: {
                            Authorization: `Bearer ${newToken}`,
                            'Content-Type': 'multipart/form-data',
                        },
                        responseType: 'blob',
                        timeout: 300000,
                    });
                    console.log('Retry successful:', retryResponse.status);
                    return retryResponse;
                }
            }

            throw error;
        }
    };

    const fetchAudioBooks = async () => {
        try {
            const response = await makeAuthenticatedRequest(`${process.env.VITE_API_URL}/api/getaudiobooks`);

            if (response.ok) {
                const books = await response.json();
                setAudioBooks(books);
                console.log('Fetched audiobooks:', books);
            } else {
                console.error('Failed to fetch audiobooks:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching audiobooks:', error);
        }
    };

    const storeAudioBook = async (audioBlob: Blob, title: string, originalFileName: string): Promise<AudioBook> => {
        try {
            const formData = new FormData();
            formData.append('audioFile', audioBlob, 'audiobook.wav');
            formData.append('title', title);
            formData.append('originalFileName', originalFileName);

            const response = await makeAuthenticatedRequest(`${process.env.VITE_API_URL}/api/createAudioBook`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to store audiobook');
            }

            const audioBook = await response.json();

            // Update local state
            setAudioBooks(prev => [audioBook, ...prev]);

            console.log('Audiobook stored successfully:', audioBook);
            return audioBook;
        } catch (error) {
            console.error('Error storing audiobook:', error);
            throw error;
        }
    };

    const deleteAudioBook = async (id: string) => {
        try {
            const response = await makeAuthenticatedRequest(`${process.env.VITE_API_URL}/api/audiobooks/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete audiobook');
            }

            // Update local state
            setAudioBooks(prev => prev.filter(book => book.fileId !== id));
            console.log('Audiobook deleted successfully');
            return audioBooks
        } catch (error) {
            console.error('Error deleting audiobook:', error);
            throw error;
        }
    };

    const getDownloadUrl = async (id: string)=> {
        try {
            const response = await makeAuthenticatedRequest(`${process.env.VITE_API_URL}/api/audiobooks/${id}/download`);

            if (!response.ok) {
                throw new Error('Failed to get download URL');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting download URL:', error);
            throw error;
        }
    };

    const login = () => {
        window.location.href = `${process.env.VITE_API_URL}/auth/google`;
    };

    const logout = () => {
        setUser(null);
        setApiToken(null);
        setAudioBooks([]);
        window.location.href = `${process.env.VITE_API_URL}/auth/logout`;
    };

    const value = React.useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
            apiToken,
            audioBooks,
            makeAuthenticatedFormRequest,
            fetchAudioBooks,
            storeAudioBook,
            deleteAudioBook,
            getDownloadUrl,
        }),
        [user, loading, apiToken, audioBooks]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
