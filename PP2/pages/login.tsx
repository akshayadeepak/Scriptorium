import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from './code-templates.module.css';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { login } = useAuth();

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
      <div className={`${styles.blogBackground} h-[calc(100vh-64px)]`}>
        <div className="min-h-screen w-full flex justify-center items-center p-5">
          <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-center font-bold text-xl p-1">Login to Your Account</h1>
      
            {success && (
              <div className="text-green-600 my-2 p-2 bg-green-100 rounded">
                {success}
              </div>
            )}
      
            {error && (
              <div className="text-red-600 my-2 p-2 bg-red-100 rounded">
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
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex justify-center gap-5 mt-5">
                <button
                  type="button"
                  className="px-4 py-1 bg-white text-blue-400 rounded border border-blue-400 hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => router.push('/')}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-white text-blue-400 rounded border border-blue-400 hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="px-2 py-1 bg-white rounded text-xs hover:bg-gray-200"
                  onClick={() => router.push('/signup')}>
                    Sign up
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
} 