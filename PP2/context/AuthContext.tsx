import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
    id: number;
    email: string;
    username?: string;
    permission: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => Promise<void>;
    logout: () => void;
    isLoggedIn: boolean;
}

const defaultContextValue: AuthContextType = {
    user: null,
    login: async (token: string, userData: User) => {},
    logout: () => {},
    isLoggedIn: false
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('/api/auth/verify', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await response.json();
                    
                    if (data.user) {
                        setUser(data.user);
                    } else {
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                } catch (error) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
        };

        initializeAuth();
    }, []);

    const login = async (token: string, userData: User) => {
        try {
            localStorage.setItem('token', token);
            setUser(userData);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for using auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 