import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/AuthGuard';
import styles from './edit-profile.module.css';

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
        // Fetch current profile data to pre-fill the form
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
            <div className={styles.pageContainer}>
                <div className={styles.contentWrapper}>
                    <h2 className={styles.pageTitle}>Edit Profile</h2>

                    {error && (
                        <div className={styles.alert + ' ' + styles.errorAlert}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className={styles.alert + ' ' + styles.successAlert}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={profile.username}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={profile.phoneNumber}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={profile.firstName}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={profile.lastName}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Avatar URL</label>
                            <input
                                type="text"
                                name="avatar"
                                value={profile.avatar}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.buttonContainer}>
                            <button
                                type="button"
                                onClick={() => router.push('/profile')}
                                className={styles.button + ' ' + styles.secondaryButton}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={styles.button + ' ' + styles.primaryButton}
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthGuard>
    );
};

export default EditProfile; 