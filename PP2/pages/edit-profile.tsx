import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/AuthGuard';
import styles from './edit-profile.module.css';
import Navbar from '@/components/Navbar';

const EditProfile: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        firstName: '',
        lastName: '',
        avatar: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/auth/edit-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profile)
        });

        if (response.ok) {
            router.push('/profile');
        } else {
            console.error('Failed to update profile');
        }
    };

    return (
        <AuthGuard>
            <div className="w-full min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" 
                 style={{ 
                     backgroundImage: "url('/banners/index.png')", 
                     position: 'relative' 
                 }}>
                <div className="absolute inset-0" style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(5px)', 
                    zIndex: 0
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Navbar />
                    <div className="w-full p-4">
                        <div className="bg-white bg-opacity-80 rounded-t-lg shadow p-6">
                            <h2 className="text-center text-2xl font-bold text-gray-800">Edit Profile</h2>
                        </div>
                        <div className="bg-white bg-opacity-80 rounded-b-lg shadow p-6 overflow-auto" style={{ maxHeight: '74vh' }}>
                            {error && (
                                <div className="text-red-500 text-center mb-4">{error}</div>
                            )}

                            {success && (
                                <div className="text-green-500 text-center mb-4">{success}</div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={profile.username}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={profile.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profile.firstName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profile.lastName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700">Avatar URL</label>
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={profile.avatar}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>

                                <div className="flex justify-center gap-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile')}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
};

export default EditProfile; 