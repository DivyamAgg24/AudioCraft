import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AudioBook } from '../types';
import { useAuth } from '../contexts/AuthContext';

const AudioPlayerPage = () => {
    const [currentBook, setCurrentBook] = useState<AudioBook | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [error, setError] = useState<string | null>(null);

    const {
        user,
        audioBooks,
        fetchAudioBooks,
        deleteAudioBook,
        getDownloadUrl
    } = useAuth()

    if (!user) {
        return <div>Please log in to create audiobook.</div>;
    }
    console.log(audioBooks, currentBook)
    useEffect(() => {
        if (audioBooks.length > 0 && !currentBook) {
            setCurrentBook(audioBooks[0]);
        }
    }, [audioBooks, currentBook]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentBook]);
    
    useEffect(()=>{
        fetchAudioBooks()
    }, [])

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        const newVolume = parseFloat(e.target.value);

        if (audio) {
            audio.volume = newVolume;
        }
        setVolume(newVolume);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const downloadAudio = async (audioBook: AudioBook) => {
        try {
            const {audioUrl, fileName} = await getDownloadUrl(audioBook.fileId)
            const downloadUrl = audioBook.audioUrl || audioUrl;
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

    const handleDeleteAudioBook = async (audioBook: AudioBook) => {
        if (window.confirm(`Are you sure you want to delete "${audioBook.title}"?`)) {
            try {
                // Stop playback if this audiobook is currently playing
                if (currentBook?.fileId === audioBook.fileId) {
                    const audio = audioRef.current;
                    if (audio) {
                        audio.pause();
                    }
                    setCurrentBook(null)
                    setIsPlaying(false);
                }

                const audiobooks = await deleteAudioBook(audioBook.fileId);
                // Clean up audio ref
                audioRef.current = null
                setCurrentBook(audiobooks[0])
            } catch (error) {
                console.error('Error deleting audiobook:', error);
                setError('Failed to delete audiobook');
            }
        }
    };

    if (audioBooks.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <BookOpen className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">No Audiobooks Yet</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Create your first audiobook by uploading a PDF document.
                        </p>
                        <Link
                            to="/upload"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Upload PDF
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Your Audio Library</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Current Player */}
                {currentBook && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Book Cover Placeholder */}
                            <div className="md:w-64 w-full">
                                <div className="bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl aspect-square flex items-center justify-center text-white text-6xl font-bold shadow-lg">
                                    {currentBook.title.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {/* Player Controls */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentBook.title}</h2>
                                <p className="text-gray-600 mb-6">Duration: {formatTime(duration || 0)}</p>

                                {/* Audio Element */}
                                <audio
                                    ref={audioRef}
                                    src={currentBook.audioUrl}
                                    preload="metadata"
                                />

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration || 0)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                </div>

                                {/* Control Buttons */}
                                <div className="flex items-center justify-center space-x-6 mb-6">
                                    <button className="p-3 text-gray-600 hover:text-blue-600 transition-colors">
                                        <SkipBack className="h-6 w-6" />
                                    </button>

                                    <button
                                        onClick={togglePlayPause}
                                        className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                                    >
                                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                                    </button>

                                    <button className="p-3 text-gray-600 hover:text-blue-600 transition-colors">
                                        <SkipForward className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Volume Control */}
                                <div className="flex items-center space-x-3">
                                    <Volume2 className="h-5 w-5 text-gray-600" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Book Library */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">All Audiobooks</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {audioBooks.map((book) => (
                            <div
                                key={book.fileId}
                                className={`bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${currentBook?.fileId === book.fileId
                                        ? 'border-blue-500 bg-red-500'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                onClick={() => setCurrentBook(book)}
                            >
                                <div className="bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg aspect-square flex items-center justify-center text-white text-4xl font-bold mb-4">
                                    {book.title.charAt(0).toUpperCase()}
                                </div>
                                <div className='flex justify-between items-center'>
                                    <h4 className="font-semibold text-gray-900 mb-2 truncate">{book.title}</h4>
                                    <button className='px-1' onClick={()=>{handleDeleteAudioBook(book)}}>
                                        <Trash2 className='h-6 w-6 text-red-600 '></Trash2>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Created: {book.createdAt.toLocaleString()}
                                </p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentBook(book);
                                        }}
                                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Play
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            downloadAudio(book);
                                        }}
                                        className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayerPage;