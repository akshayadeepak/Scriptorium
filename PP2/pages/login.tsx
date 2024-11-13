import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

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
                <h2>Login</h2>
                
                {success && (
                    <div style={{ 
                        color: 'green', 
                        margin: '10px', 
                        padding: '10px', 
                        backgroundColor: '#e8f5e9',
                        borderRadius: '4px'
                    }}>
                        {success}
                    </div>
                )}

                {error && (
                    <div style={{ 
                        color: 'red', 
                        margin: '10px', 
                        padding: '10px', 
                        backgroundColor: '#ffebee',
                        borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-field" style={{margin: '30px'}}>
                        <label style={{margin: '30px'}}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <label style={{margin: '30px'}}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',  // Space between buttons
                        marginTop: '20px'
                    }}>
                       

                        <button 
                            type="button" 
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'grey',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                            onClick={() => router.push('/')}
                        >
                            Back
                        </button>
                        <button 
                            type="submit" 
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'grey',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 