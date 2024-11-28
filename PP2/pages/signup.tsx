import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from './code-templates.module.css';
import { useTheme } from '../context/ThemeContext'; // Import ThemeContext

export default function Signup() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const { isDarkMode, toggleDarkMode } = useTheme(); // Use the theme context

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend validation
        if (!email.trim() || !password.trim() || !username.trim() || !phone.trim()) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        // Password strength validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        // Phone number format validation
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username, 
                    password, 
                    email, 
                    phoneNumber: phone
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Signup failed');
                return;
            }

            localStorage.setItem('token', data.token);
            router.push('/login?signup=success');
            
        } catch (error) {
            console.error('Signup error:', error);
            setError('Connection error. Please try again.');
        }
    };

    return (
        <div className={`${styles.blogBackground} h-[calc(100vh-64px)] ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="min-h-screen w-full flex justify-center items-center p-5">
        <div className={`w-full max-w-md ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'} p-8 rounded-lg shadow-md`}>
            <h2 className="text-center mb-6 text-xl font-bold">Create your account</h2>

            {error && (
            <div className={`${isDarkMode ? 'text-red-400 bg-red-900' : 'text-red-700 bg-red-100'} p-3 rounded mb-4`}>
                {error}
            </div>
            )}

            <form onSubmit={handleSignup}>
            <div className="mb-4">
                <label className="block mb-2">Email</label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'} rounded`}
                required
                />
            </div>

            <div className="mb-4">
                <label className="block mb-2">Username</label>
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
                />
            </div>

            <div className="mb-4">
                <label className="block mb-2">Phone Number</label>
                <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full p-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'} rounded`}
                required
                />
            </div>

            <div className="mb-4">
                <label className="block mb-2">Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'} rounded`}
                required
                />
            </div>

            <div className="mb-4">
                <label className="block mb-2">Confirm Password</label>
                <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full p-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300'} rounded`}
                required
                />
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <button
                type="submit"
                className={`px-4 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                    isDarkMode
                                        ? 'bg-gray-800 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                                        : 'bg-white text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                }`}
                >
                Sign Up
                </button>
                <button
                type="button"
                onClick={() => router.push('/')}
                className={`px-4 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                    isDarkMode
                                        ? 'bg-gray-800 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                                        : 'bg-white text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                }`}
                >
                Back
                </button>
            </div>
            <div className="flex justify-center mt-4">
                <p className="px-2 py-1 text-xs font-bold">
                  Already have an Account?
                </p>
                <button 
                  type="button"
                  className={`px-2 py-1 rounded text-xs hover:bg-gray-200 ${
                                    isDarkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-white'
                  }`}
                  onClick={() => router.push('/login')}>
                    Login
                </button>
              </div>
            </form>
        </div>
        {/* Theme Toggle Button */}
            <button
                onClick={toggleDarkMode}
                className={`fixed bottom-4 right-4 p-3 rounded-full shadow-md focus:outline-none ${
                    isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                title="Toggle Theme"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>
        </div>
        
        </div>
    );
} 