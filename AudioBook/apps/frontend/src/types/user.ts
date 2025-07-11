export interface User {
    id: string;
    googleId: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
    lastLogin: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => void;
    logout: () => void;
}