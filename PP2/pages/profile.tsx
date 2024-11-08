import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/AuthGuard';

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
            <div style={{ 
                minHeight: '100vh', 
                width: '100%', 
                backgroundColor: 'lightgrey',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ 
                        textAlign: 'center', 
                        marginBottom: '1.5rem',
                        fontSize: '1.5rem',
                        fontWeight: 'bold' 
                    }}>Profile</h2>

                    {profile.avatar ? (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            marginBottom: '1.5rem' 
                        }}>
                            <img 
                                src={profile.avatar} 
                                alt="Profile" 
                                style={{
                                    width: '128px',
                                    height: '128px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            marginBottom: '1.5rem' 
                        }}>
                            <span style={{ color: 'grey' }}>Avatar not set</span>
                        </div>
                    )}

                    <div style={{ 
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee'
                    }}>
                        <strong>Username:</strong> {profile.username}
                    </div>

                    <div style={{ 
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee'
                    }}>
                        <strong>Email:</strong> {profile.email}
                    </div>

                    {profile.phoneNumber ? (
                        <div style={{ 
                            marginBottom: '1rem',
                            padding: '0.5rem',
                            borderBottom: '1px solid #eee'
                        }}>
                            <strong>Phone:</strong> {profile.phoneNumber}
                        </div>
                    ) : (
                        <div style={{ 
                            marginBottom: '1rem',
                            padding: '0.5rem',
                            borderBottom: '1px solid #eee'
                        }}>
                            <strong>Phone:</strong> Not set
                        </div>
                    )}

                    <div style={{ 
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee'
                    }}>
                        <strong>First name:</strong> {profile.firstName || 'Not set'} 
                    </div>

                    <div style={{ 
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        borderBottom: '1px solid #eee'
                    }}>
                        <strong>Last name:</strong> {profile.lastName || 'Not set'}
                    </div>

                    

                    <h3 style={{ 
                        textAlign: 'center', 
                        marginTop: '2rem',
                        marginBottom: '1rem',
                        fontSize: '1.2rem',
                        fontWeight: 'bold' 
                    }}>My Code Templates</h3>

                    {templates.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'grey' }}>No templates available</p>
                    ) : (
                        <ul>
                            {templates.map(template => (
                                <li key={template.id} style={{ marginBottom: '1rem' }}>
                                    <strong>{template.title}</strong> ({template.language})
                                    <pre style={{
                                        backgroundColor: '#f5f5f5',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        overflowX: 'auto'
                                    }}>
                                        <code>{template.content}</code>
                                    </pre>
                                    {template.explanation && <p>{template.explanation}</p>}
                                    {template.tags.map(tag => (
                                        <span key={tag.name} style={{ marginRight: '0.5rem', color: '#888' }}>
                                            #{tag.name}
                                        </span>
                                    ))}
                                </li>
                            ))}
                        </ul>
                    )}

                    <div style={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem',
                        marginTop: '2rem'
                    }}>
                        <button 
                            onClick={() => router.push('/')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'grey',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Back to Home
                        </button>
                        <button 
                            onClick={() => router.push('/edit-profile')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'grey',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
};

export default Profile;