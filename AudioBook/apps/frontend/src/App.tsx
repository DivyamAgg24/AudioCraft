import { memo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import UploadPage from './pages/Upload';
import AudioPlayerPage from './pages/AudioPlayer';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Memoize UploadPage to prevent unnecessary re-renders
const MemoizedUploadPage = memo(UploadPage);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
    const { user, loading } = useAuth();

    useEffect(() => {
        console.log('ProtectedRoute rendered:', { user, loading });
    }, [user, loading]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return user ? <>{children}</> : <Navigate to="/" replace />;
});

function App() {

    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="min-h-screen bg-white">
                    <Navigation />
                    <main className="animate-fade-in">
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route
                                path="/upload"
                                element={
                                    <ProtectedRoute>
                                        <MemoizedUploadPage
                                            key="upload-page"
                                        />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/library"
                                element={
                                    <ProtectedRoute>
                                        <AudioPlayerPage/>
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;