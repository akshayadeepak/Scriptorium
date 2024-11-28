import React, { createContext, useState, useContext, useEffect } from 'react';
import { verifyToken } from '../utils/token';

interface User {
    id: number;
    email: string;
    username: string;
    permission: string;
}

interface AuthContextType {
    user: User | null;
    avatar: string;
    handleSetAvatar: (avatar: string) => void;
    login: (token: string, userData: User) => Promise<void>;
    logout: () => void;
    isLoggedIn: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [avatar, setAvatar] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');
                const storedAvatar = localStorage.getItem('avatar');
    
                if (token && storedUser) {
                    const payload = verifyToken(token);
                    if (payload && payload.userId) {
                        const userData = JSON.parse(storedUser);
                        setUser(userData);
                        setAvatar(storedAvatar || '');
                        setIsLoggedIn(true);
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('avatar');
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('avatar');
            } finally {
                setIsLoading(false);
            }
        };
    
        initializeAuth();
    }, []);
    

    const login = async (token: string, userData: User) => {
        console.log('Login called with:', { token, userData });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = () => {
        console.log('Logout called');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsLoggedIn(false);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const handleSetAvatar = (avatar: string) => {
        setAvatar(avatar);
        localStorage.setItem('avatar', avatar);
    };
    
    return (
        <AuthContext.Provider value={{ user, avatar, handleSetAvatar, login, logout, isLoggedIn, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
