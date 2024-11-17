import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

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
        <div className="min-h-screen w-full flex justify-center items-center p-5 bg-cover bg-center"
        style={{ backgroundImage: "url('/banners/index.png')" }}>
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-center mb-6 text-xl font-bold">Create your account</h2>

            {error && (
            <div className="text-red-700 bg-red-100 p-3 rounded mb-4">
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
                className="w-full p-2 border border-gray-300 rounded"
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
                className="w-full p-2 border border-gray-300 rounded"
                required
                />
            </div>

            <div className="mb-4">
                <label className="block mb-2">Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
                />
            </div>

            <div className="mb-4">
                <label className="block mb-2">Confirm Password</label>
                <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
                />
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <button
                type="submit"
                className="px-4 py-1 bg-white text-blue-400 rounded border border-blue-400 hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                Sign Up
                </button>
                <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-1 bg-white text-blue-400 rounded border border-blue-400 hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                Back
                </button>
            </div>
            </form>
        </div>
        </div>
    );
} 