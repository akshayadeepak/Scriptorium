import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './index.module.css';
import Navbar from '../components/Navbar';
import TextScramble from '../components/TextScramble';
import { useAuth } from '../context/AuthContext';


export default function Home() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false); // State to manage theme
  const [showCookieNotice, setShowCookieNotice] = useState(true);
  const [serverStatus, setServerStatus] = useState('gray');

  // Messages to rotate in the hero section
  const messages = [
    "Discover tools for coding, sharing, and learning.",
    "Join a community of creators and developers.",
    "Learn, code, and share your projects.",
    "Explore, create, and inspire others."
  ];

  // Cycle messages in hero section every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const handleLogout = () => {
    logout();
  };

  // Handle search button click to navigate to the search results page
  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/search?query=${searchTerm}`);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleAcceptCookies = () => {
    setShowCookieNotice(false);
  };

  useEffect(() => {
    // Statuses: 'gray' (Offline), 'yellow' (Starting), 'green' (Online)
    const statuses = ['gray', 'yellow', 'green'];
    let index = 0;

    const interval = setInterval(() => {
      setServerStatus(statuses[index]);
      index++;

      if (index >= statuses.length) {
        clearInterval(interval);
      }
    }, 2000); // wait for rest of website to load

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`${styles.pageContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      <Navbar />

      {/* Server Status Indicator */}
      <div className={styles.serverStatusContainer}>
        <span className={styles.serverStatusLabel}>Website Status:</span>
        <div className={`${styles.serverStatusIndicator} ${styles[serverStatus]}`}></div>
      </div>

      {/* Main Content Section */}
      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <div className={styles.heroTextBackground}>
            <h1 className={styles.heroTitle}>Welcome to Scriptorium</h1>
            <TextScramble text={messages[currentMessage]} className={styles.heroSubtitle} />
            {!isLoggedIn && (
              <button onClick={() => router.push('/signup')} className={`${styles.heroButton} rounded`}>Get Started</button>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featureSection}>
          <div className={`${styles.featureCard} rounded-xl`} onClick={() => router.push('/code')}>
            <h3>Run Code</h3>
            <p>Experiment with code in multiple languages, test solutions, and collaborate instantly.</p>
          </div>
          <div className={`${styles.featureCard} rounded-xl`} onClick={() => router.push('/blog')}>
            <h3>Blog</h3>
            <p>Read, write, and share insights with the community, and discover valuable tutorials.</p>
          </div>
          <div className={`${styles.featureCard} rounded-xl`} onClick={() => router.push('/code-templates')}>
            <h3>Code Templates</h3>
            <p>Create, save, and share reusable code templates to streamline your projects.</p>
          </div>
        </section>

        {/* Code Templates Section */}
        <section className={styles.templateSection}>
          <h2 className={styles.sectionTitle}>Popular Code Templates</h2>
          <div className={styles.templateGrid}>
            {/* Placeholder Template Cards */}
            <div className={`${styles.templateCard} rounded-xl`}>
              <h3>JavaScript Array Algorithms</h3>
              <p>A collection of useful array manipulation functions for JavaScript projects.</p>
            </div>
            <div className={`${styles.templateCard} rounded-xl`}>
              <h3>Python Mass Data Processing</h3>
              <p>Parallelized data processing utilities for data science and machine learning.</p>
            </div>
            <div className={`${styles.templateCard} rounded-xl`}>
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
            <div className={`${styles.blogCard} rounded-xl`}>
              <h3>Cryptographer wins Turing Award</h3>
              <p>Mark Mu recently won a Turing award for their contributions to the pina colada algorithm.</p>
            </div>
            <div className={`${styles.blogCard} rounded-xl`}>
              <h3>Getting Started with Next.js</h3>
              <p>A comprehensive guide to building web applications with Next.js.</p>
            </div>
            <div className={`${styles.blogCard} rounded-xl`}>
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

      {/* Theme Toggle Button - Moved to Bottom Right */}
      <button onClick={toggleDarkMode} className={styles.themeToggleButton}>
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {/* Cookie Notification */}
      {showCookieNotice && (
        <div className={styles.cookieNotification}>
          <p>
            We use cookies to enhance your browsing experience.
            <a href="/privacy" className={styles.cookieLink}> Learn more</a>.
          </p>
          <button onClick={handleAcceptCookies} className={styles.cookieButton}>
            Accept
          </button>
        </div>
      )}
    </div>
  );
}
