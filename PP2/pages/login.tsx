import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from './code-templates.module.css';
import { useTheme } from '../context/ThemeContext'; // Import ThemeContext
import Navbar from '@/components/Navbar';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { login } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme(); // Use the theme context

    useEffect(() => {
        if (router.query.signup === 'success') {
            setSuccess('Account created successfully! Please log in.');
        }
    }, [router.query]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                await login(data.token, data.user);
                setSuccess('Login successful!');
                setTimeout(() => {
                    router.push('/');
                }, 500);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An error occurred during login');
        }
    };

    return (
      <div className={`${styles.blogBackground} h-[calc(100vh-64px)] ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="min-h-screen w-full flex justify-center items-center p-5">
          <div className={`w-full max-w-md ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'} p-8 rounded-lg shadow-md`}>
            <h1 className="text-center font-bold text-xl p-1">Login to Your Account</h1>
      
            {success && (
              <div className={`${isDarkMode ? 'text-green-400 bg-green-900' : 'text-green-600 bg-green-100'} my-2 p-2 rounded`}>
                {success}
              </div>
            )}
      
            {error && (
              <div className={`${isDarkMode ? 'text-red-400 bg-red-900' : 'text-red-600 bg-red-100'} my-2 p-2 rounded`}>
                {error}
              </div>
            )}
      
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300'}`}
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300'}`}
                />
              </div>
              <div className="flex justify-center gap-5 mt-5">
                <button
                  type="button"
                  className={`px-4 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isDarkMode
                      ? 'bg-gray-800 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                      : 'bg-white text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                  }`}
                  onClick={() => router.push('/')}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isDarkMode
                      ? 'bg-gray-800 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                      : 'bg-white text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white'
                  }`}
                >
                  Login
                </button>
              </div>
              <div className="flex justify-center mt-4">
                <p className="px-2 py-1 text-xs font-bold">
                  Don't have an Account?
                </p>
                <button 
                  type="button"
                  className={`px-2 py-1 rounded text-xs hover:bg-gray-200 ${
                    isDarkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-white'
                  }`}
                  onClick={() => router.push('/signup')}>
                    Sign up
                </button>
              </div>
            </form>
          </div>
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