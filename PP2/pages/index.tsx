import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from './index.module.css';
import logo from '../images/logo.jpg'; // Logo path
import avatarPlaceholder from '../images/placeholderpfp.webp';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMessage, setCurrentMessage] = useState(0);
  const messages = [
    "Discover tools for coding, sharing, and learning.",
    "Join a community of creators and developers.",
    "Learn, code, and share your projects.",
    "Explore, create, and inspire others."
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    // Rotate messages every 3 seconds
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  const handleSearch = () => {
    router.push(`/search?query=${searchTerm}`);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Navigation Bar */}
      <header className={styles.header}>
        <div className={styles.navLeft}>
          <Image src={logo} alt="Scriptorium Logo" className={styles.logo} />
          <span className={styles.navLink} onClick={() => router.push('/home')}>Home</span>
          <span className={styles.navLink} onClick={() => router.push('/blog')}>Blog</span>
          <span className={styles.navLink} onClick={() => router.push('/code')}>Run Code</span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search blog posts, code templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchButton}>Search</button>
          </div>
          {!isLoggedIn ? (
            <>
              <button className={styles.navButton} onClick={() => router.push('/login')}>Log In</button>
              <button className={styles.signupButton} onClick={() => router.push('/signup')}>Sign Up</button>
            </>
          ) : (
            <>
              <button className={styles.navButton} onClick={handleLogout}>Log Out</button>
              <Image src={avatarPlaceholder} alt="User Avatar" className={styles.avatar} onClick={() => router.push('/profile')} />
            </>
          )}
        </div>
      </header>

      {/* Main Content Section */}
      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <div className={styles.heroTextBackground}>
            <h1 className={styles.heroTitle}>Welcome to Scriptorium</h1>
            <p className={styles.heroSubtitle}>{messages[currentMessage]}</p>
            {!isLoggedIn && (
              <button onClick={() => router.push('/signup')} className={styles.heroButton}>Get Started</button>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featureSection}>
          <div className={styles.featureCard} onClick={() => router.push('/code')}>
            <h3>Run Code</h3>
            <p>Experiment with code in multiple languages, test solutions, and collaborate instantly.</p>
          </div>
          <div className={styles.featureCard} onClick={() => router.push('/blog')}>
            <h3>Blog</h3>
            <p>Read, write, and share insights with the community, and discover valuable tutorials.</p>
          </div>
        </section>

        {/* Code Templates Section */}
        <section className={styles.templateSection}>
          <h2 className={styles.sectionTitle}>Popular Code Templates</h2>
          <div className={styles.templateGrid}>
            {/* Placeholder Template Cards */}
            <div className={styles.templateCard}>
              <h3>JavaScript Array Algorithms</h3>
              <p>A collection of useful array manipulation functions for JavaScript projects.</p>
            </div>
            <div className={styles.templateCard}>
              <h3>Python Mass Data Processing</h3>
              <p>Parallelized data processing utilities for data science and machine learning.</p>
            </div>
            <div className={styles.templateCard}>
              <h3>Java HTTP Client</h3>
              <p>Reusable HTTP client functions for making API requests in Java.</p>
            </div>
          </div>
        </section>

        {/* Featured Blog Posts Section */}
        <section className={styles.blogSection}>
          <h2 className={styles.sectionTitle}>Featured Blog Posts</h2>
          <div className={styles.blogGrid}>
            {/* Placeholder Blog Post Cards */}
            <div className={styles.blogCard}>
              <h3>Cryptographer wins Turing Award</h3>
              <p>Mark Mu recently won a turing award for their contributions to the pina colada algorithm</p>
            </div>
            <div className={styles.blogCard}>
              <h3>Getting Started with Next.js</h3>
              <p>A comprehensive guide to building web applications with Next.js.</p>
            </div>
            <div className={styles.blogCard}>
              <h3>10 Rust Tips & Tricks</h3>
              <p>Enhance your Rust skills with these practical tips and tricks.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>&copy; 2024 Scriptorium. All rights reserved.</span>
        <a href="/terms" className={styles.footerLink}>Terms of Service</a>
        <a href="/privacy" className={styles.footerLink}>Privacy Policy</a>
      </footer>
    </div>
  );
}