import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader, Download, Play, Pause } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { AudioBook } from '../types';
import dotenv from "dotenv"

dotenv.config()

const UploadPage = () => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

    const {
        user,
        makeAuthenticatedFormRequest,
        audioBooks,
        fetchAudioBooks,
        storeAudioBook,
        getDownloadUrl,
    } = useAuth();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [latestAudioBook, setLatestAudioBook] = useState<AudioBook | null>(null)

    // Update lastUploadedFileName when uploadedFile changes

    useEffect(() => {
        return () => {
            audioBooks.forEach((book) => {
                if (book.audioUrl) {
                    URL.revokeObjectURL(book.audioUrl);
                }
            });
        };
    }, [audioBooks]);

    if (!user) {
        return <div>Please log in to create audiobook.</div>;
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0] && files[0].type === 'application/pdf') {
            setUploadedFile(files[0]);
            setError(null);
        } else {
            setError('Please upload a PDF file only');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            if (files[0].type === 'application/pdf') {
                setUploadedFile(files[0]);
                setError(null);
            } else {
                setError('Please upload a PDF file only');
            }
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!uploadedFile) {
            setError('Please select a file first');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const metadata = {
                id: Date.now().toString(),
                title: uploadedFile.name.replace('.pdf', ''),
                fileName: uploadedFile.name,
            };
            formData.append('metadata', JSON.stringify(metadata));

            console.log('Uploading file:', uploadedFile.name);

            // Generate the audiobook
            const response = await makeAuthenticatedFormRequest(`${process.env.PYTHON_BACKEND_URL}/v1/generate`, formData);
            const audioBlob = new Blob([response.data], { type: 'audio/wav' });

            // Store the audiobook in Appwrite and database
            const newAudioBook = await storeAudioBook(audioBlob, metadata.title, uploadedFile.name);

            setLatestAudioBook(newAudioBook);
            console.log("latestAudioBook: ", latestAudioBook)
            await fetchAudioBooks()

            console.log('Audiobook created and stored successfully');
        } catch (error: any) {
            console.error('Error processing file:', error);
            if (error.response?.status === 504) {
                setError('Processing timeout. Please try with a smaller file.');
            } else if (error.response?.status === 400) {
                setError('Invalid file format. Please upload a valid PDF.');
            } else {
                setError('Failed to process the file. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleAudioPlayback = async (audioBook: AudioBook) => {
        const audioId = audioBook.fileId;
        let audio = audioRef.current;

        if (!audio) {
            audio = new Audio();
            audioRef.current = audio;

            // Set up audio events
            audio.onended = () => setCurrentlyPlaying(null);
            audio.onpause = () => setCurrentlyPlaying(null);
            audio.onplay = () => setCurrentlyPlaying(audioId);
        }

        if (currentlyPlaying && currentlyPlaying !== audioId) {
            // Pause currently playing audio
            const currentAudio = audioRef.current;
            if (currentAudio) {
                currentAudio.pause();
            }
        }

        if (audio.paused) {
            try {
                // If no src or different audiobook, set new src
                if (!audio.src || !audio.src.includes(audioBook.fileId)) {
                    const downloadUrl = audioBook.audioUrl || await getDownloadUrl(audioBook.fileId);
                    audio.src = downloadUrl;
                }
                await audio.play();
                setCurrentlyPlaying(audioId);
            } catch (error) {
                console.error('Error playing audio:', error);
                setError('Failed to play audio');
            }
        } else {
            audio.pause();
            setCurrentlyPlaying(null);
        }
    };

    const downloadAudio = async (audioBook: AudioBook) => {
        try {
            const {audioUrl, fileName} = await getDownloadUrl(audioBook.fileId)
            const downloadUrl = audioBook.audioUrl || audioUrl;
            console.log(audioUrl, fileName)
            console.log(`${audioBook.title}_audiobook.wav`)
            console.log("downloadUrl: ",downloadUrl)
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading audio:', error);
            setError('Failed to download audio');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Your Audiobook</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Upload your PDF document and let our AI transform it into a natural-sounding audiobook.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${dragActive
                        ? 'border-blue-400 bg-blue-50'
                        : uploadedFile
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {uploadedFile ? (
                        <div className="space-y-4">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <h3 className="text-xl font-semibold text-gray-900">File Ready</h3>
                            <div className="bg-white rounded-lg p-4 border border-green-200 flex items-center justify-between max-w-md mx-auto">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-8 w-8 text-red-500" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 truncate">{uploadedFile.name}</p>
                                        <p className="text-sm text-gray-500">{Math.round(uploadedFile.size / 1024)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={removeFile}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing}
                                className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center">
                                        <Loader className="animate-spin h-5 w-5 mr-2" />
                                        Processing...
                                    </span>
                                ) : (
                                    'Create Audiobook'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                            <h3 className="text-xl font-semibold text-gray-900">Upload Your PDF</h3>
                            <p className="text-gray-600">Drag and drop your PDF file here, or click to browse</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Choose File
                            </button>
                        </div>
                    )}
                </div>

                {latestAudioBook?.audioUrl && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Audiobook is Ready!</h2>
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => toggleAudioPlayback(latestAudioBook)}
                                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                                >
                                    {audioRef.current?.paused ? (
                                        <Play className="h-6 w-6" />
                                    ) : (
                                        <Pause className="h-6 w-6" />
                                    )}
                                </button>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {latestAudioBook.title}
                                    </h3>
                                    <p className="text-sm text-gray-500">Audiobook</p>
                                </div>
                            </div>
                            <button
                                onClick={()=> downloadAudio(latestAudioBook)}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                            </button>
                        </div>

                        <audio
                            ref={audioRef}
                            src={latestAudioBook.audioUrl}
                            onEnded={() => audioRef.current?.pause()}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPage;