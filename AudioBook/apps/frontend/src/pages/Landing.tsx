import React from 'react';
import { Upload, Music, Download, Zap, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
    const { user, login, loading } = useAuth();
    const features = [
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Convert your PDFs to audiobooks in minutes with our advanced AI technology.'
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'Your documents are processed securely and deleted after conversion.'
        },
        {
            icon: Globe,
            title: 'Multi-Language',
            description: 'Support for multiple languages and natural-sounding voice synthesis.'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Transform Your
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600"> PDFs</span>
                            <br />
                            Into Audiobooks
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Experience the future of reading. Upload any PDF document and get a professional-quality
                            audiobook with natural-sounding AI voices in minutes.
                        </p>
                        
                        {user ? (
                            // Authenticated user - show app navigation
                            <div>
                                <p className="text-lg text-gray-700 mb-6">
                                    Welcome back, <span className="font-semibold text-blue-600">{user.name}</span>! 
                                    Ready to continue your audio journey?
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to="/upload"
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Upload className="inline-block mr-2 h-5 w-5" />
                                        Start Creating
                                    </Link>
                                    <Link
                                        to="/library"
                                        className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Music className="inline-block mr-2 h-5 w-5" />
                                        View Library
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            // Unauthenticated user - show sign in
                            <div>
                                <button
                                    onClick={login}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl mb-4"
                                >
                                    Sign in with Google to Get Started
                                </button>
                                <p className="text-gray-500">
                                    Sign in to upload books and access your personal audio library
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-20 left-10 w-20 h-20 bg-blue-300 rounded-full opacity-20 animate-bounce"></div>
                <div className="absolute top-40 right-20 w-16 h-16 bg-emerald-300 rounded-full opacity-20 animate-bounce animation-delay-1000"></div>
                <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-orange-300 rounded-full opacity-20 animate-bounce animation-delay-2000"></div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Why Choose AudioCraft?
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Our cutting-edge technology makes audiobook creation effortless and professional.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
                        >
                            <div className="bg-gradient-to-r from-blue-100 to-emerald-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                                <feature.icon className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Process Section */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Simple 3-Step Process
                        </h2>
                        <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                            From PDF to audiobook in minutes. No technical expertise required.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Upload, title: 'Upload PDF', description: 'Drag and drop your PDF document' },
                            { icon: Zap, title: 'AI Processing', description: 'Our AI converts text to natural speech' },
                            { icon: Download, title: 'Download', description: 'Get your professional audiobook' }
                        ].map((step, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-white/10 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-all duration-200">
                                    <step.icon className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                                <p className="text-blue-100">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Create Your First Audiobook?
                    </h2>
                    <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                        Join thousands of users who have transformed their reading experience with AudioCraft.
                    </p>
                    {user ? (
                        <Link
                            to="/upload"
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Get Started Now
                        </Link>
                    ) : (
                        <button
                            onClick={login}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Sign In to Get Started
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Landing;