import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/AuthGuard';
import styles from './profile.module.css';

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
            <div className={styles.pageContainer}>
                <div className={styles.contentWrapper}>
                    <h2 className={styles.pageTitle}>Profile</h2>

                    {profile.avatar ? (
                        <div className={styles.avatarContainer}>
                            <img 
                                src={profile.avatar} 
                                alt="Profile" 
                                className={styles.avatar}
                            />
                        </div>
                    ) : (
                        <div className={styles.avatarContainer}>
                            <span className={styles.noAvatar}>Avatar not set</span>
                        </div>
                    )}

                    <div className={styles.profileSection}>
                        <div className={styles.profileField}>
                            <strong>Username:</strong> {profile.username}
                        </div>

                        <div className={styles.profileField}>
                            <strong>Email:</strong> {profile.email}
                        </div>

                        <div className={styles.profileField}>
                            <strong>Phone:</strong> {profile.phoneNumber || 'Not set'}
                        </div>

                        <div className={styles.profileField}>
                            <strong>First name:</strong> {profile.firstName || 'Not set'}
                        </div>

                        <div className={styles.profileField}>
                            <strong>Last name:</strong> {profile.lastName || 'Not set'}
                        </div>
                    </div>

                    <h3 className={styles.sectionTitle}>My Code Templates</h3>

                    {templates.length === 0 ? (
                        <p className={styles.noContent}>No templates available</p>
                    ) : (
                        <ul className={styles.templatesList}>
                            {templates.map(template => (
                                <li key={template.id} className={styles.templateItem}>
                                    <h4 className={styles.templateTitle}>
                                        {template.title} <span className={styles.languageTag}>({template.language})</span>
                                    </h4>
                                    <pre className={styles.codeBlock}>
                                        <code>{template.content}</code>
                                    </pre>
                                    {template.explanation && (
                                        <p className={styles.templateExplanation}>{template.explanation}</p>
                                    )}
                                    <div className={styles.tagContainer}>
                                        {template.tags.map(tag => (
                                            <span key={tag.name} className={styles.tag}>
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className={styles.buttonContainer}>
                        <button 
                            onClick={() => router.push('/')}
                            className={styles.button}
                        >
                            Back to Home
                        </button>
                        <button 
                            onClick={() => router.push('/edit-profile')}
                            className={styles.button}
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