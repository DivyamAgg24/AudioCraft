import React from 'react';
import { BookOpen, Upload, Music } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { id: '/', label: 'Home', icon: BookOpen },
        { id: '/upload', label: 'Create', icon: Upload },
        { id: '/library', label: 'Library', icon: Music },
        // {id: '/pricing', label: "Pricing", icon: DollarSign}
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-50">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <span className="text-xl font-bold text-gray-900">AudioCraft</span>
                    </Link>

                    <div className="hidden md:flex space-x-4">
                        {navItems.map(({ id, label, icon: Icon }) => (
                            <Link
                                key={id}
                                to={id}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(id)
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="font-medium">{label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="md:hidden flex space-x-1">
                        {navItems.map(({ id, icon: Icon }) => (
                            <Link
                                key={id}
                                to={id}
                                className={`p-2 rounded-lg transition-all duration-200 ${isActive(id)
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;