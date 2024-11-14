import React, { createContext, useState, useContext, useEffect } from 'react';
import { verifyToken } from '../utils/token';

interface User {
    id: number;
    email: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => Promise<void>;
    logout: () => void;
    isLoggedIn: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                console.log('Stored token:', token);
                console.log('Stored user:', storedUser);

                if (token && storedUser) {
                    const payload = verifyToken(token);
                    console.log('Verification result:', payload);

                    if (payload && payload.userId) {
                        try {
                            const userData = JSON.parse(storedUser);
                            setUser(userData);
                            setIsLoggedIn(true);
                            console.log('Auth initialized successfully');
                        } catch (parseError) {
                            console.log('Error parsing user data from localStorage:', parseError);
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                        }
                    } else {
                        console.log('Token verification failed, clearing auth state');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false); // Ensure this only runs after all logic completes
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

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoggedIn, isLoading }}>
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
