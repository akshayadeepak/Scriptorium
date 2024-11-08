import React from "react";
import Image from "next/image";
import localFont from "next/font/local";
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
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
        maxWidth: '800px',
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center'
      }}>
        {/* User Logic Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold' 
          }}>User Logic</h2>
          
          {!isLoggedIn ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <button 
                onClick={() => router.push('/signup')} 
                style={{
                  padding: '1rem',
                  backgroundColor: 'grey',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem'
                }}
              >
                Sign Up
              </button>
              <button 
                onClick={() => router.push('/login')} 
                style={{
                  padding: '1rem',
                  backgroundColor: 'grey',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem'
                }}
              >
                Log In
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <button 
                onClick={handleLogout} 
                style={{
                  padding: '1rem',
                  backgroundColor: 'grey',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem'
                }}
              >
                Log Out
              </button>
              <button 
                onClick={() => router.push('/profile')} 
                style={{
                  padding: '1rem',
                  backgroundColor: 'grey',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '1rem'
                }}
              >
                Profile
              </button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold' 
          }}>Features</h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <button 
              onClick={() => router.push('/code')} 
              style={{
                padding: '1rem',
                backgroundColor: 'grey',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '1rem'
              }}
            >
              Run Code
            </button>
            <button 
              onClick={() => router.push('/blog')} 
              style={{
                padding: '1rem',
                backgroundColor: 'grey',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '1rem'
              }}
            >
              Blog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
