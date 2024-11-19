import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/AuthGuard';
import Navbar from '@/components/Navbar';

interface UserProfile {
    username: string;
    email: string;
    phoneNumber?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
}

interface CodeTemplate {
    id: number;
    title: string;
    language: string;
    content: string;
    explanation?: string;
    tags: { name: string }[];
}

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [templates, setTemplates] = useState<CodeTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched Profile Data:', data);
                    setProfile(data);
                }
            } catch (error) {
                console.error('Profile fetch error:', error);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchUserTemplates = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`/api/code/template?search=${encodeURIComponent(searchQuery)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data);
                }
            } catch (error) {
                console.error('Templates fetch error:', error);
            }
        };

        fetchUserTemplates();
    }, [searchQuery]);

    if (!profile) return <div>Loading...</div>;

    return (
        <AuthGuard>
            <div className="w-full min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/banners/index.png')" }}>
            <Navbar />
                <div className="w-full p-8">
                    <div className="bg-white bg-opacity-80 rounded-lg shadow p-6">
                        <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">Profile</h2>

                        {profile.avatar ? (
                            <div className="flex justify-center mb-6">
                                <img 
                                    src={profile.avatar} 
                                    alt="Profile" 
                                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center mb-6">
                                <span className="text-gray-600 italic">Avatar not set</span>
                            </div>
                        )}

                        <div className="mb-8">
                            <div className="p-4 border-b border-gray-300 transition hover:bg-gray-200">
                                <strong>Username:</strong> {profile.username}
                            </div>
                            <div className="p-4 border-b border-gray-300 transition hover:bg-gray-200">
                                <strong>Email:</strong> {profile.email}
                            </div>
                            <div className="p-4 border-b border-gray-300 transition hover:bg-gray-200">
                                <strong>Phone:</strong> {profile.phoneNumber || 'Not set'}
                            </div>
                            <div className="p-4 border-b border-gray-300 transition hover:bg-gray-200">
                                <strong>First name:</strong> {profile.firstName || 'Not set'}
                            </div>
                            <div className="p-4 border-b border-gray-300 transition hover:bg-gray-200">
                                <strong>Last name:</strong> {profile.lastName || 'Not set'}
                            </div>
                        </div>

                        <h3 className="text-center text-xl font-bold my-8 text-gray-800">My Code Templates</h3>

                        {templates.length === 0 ? (
                            <p className="text-center text-gray-600 italic p-8">No templates available</p>
                        ) : (
                            <ul className="list-none p-0">
                                {templates.map(template => (
                                    <li key={template.id} className="mb-6 p-4 border border-gray-300 rounded-lg transition hover:shadow-lg">
                                        <h4 className="text-lg font-bold mb-2 text-gray-800">
                                            {template.title} <span className="text-gray-600 text-sm">{`(${template.language})`}</span>
                                        </h4>
                                        <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
                                            <code>{template.content}</code>
                                        </pre>
                                        {template.explanation && (
                                            <p className="mt-2 text-gray-600">{template.explanation}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {template.tags.map(tag => (
                                                <span key={tag.name} className="text-blue-500 text-sm">
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex justify-center gap-4 mt-8">
                            <button 
                                onClick={() => router.push('/edit-profile')}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
};

export default Profile;