import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';
import avatarPlaceholder from '../images/placeholderpfp.webp';
import styles from './search.module.css';

const SearchResults = () => {
  const router = useRouter();
  const { query } = router.query;
  const { isLoggedIn, user, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState(query || '');
  const [results, setResults] = useState({
    users: [],
    blogs: [],
    codeTemplates: [],
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/search?query=${query}`);
        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }
        const data = await response.json();
        setResults({
          users: data.users || [],
          blogs: data.blogs || [],
          codeTemplates: data.codeTemplates || [],
        });
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    };
    if (query) fetchResults();
  }, [query]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/search?query=${searchTerm}`);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Navigation */}
      <nav className={styles.topNav}>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          Back to Homepage
        </button>
        <div className={styles.authButtons}>
          {isLoggedIn ? (
            <>
              <button onClick={logout} className={styles.logoutButton}>Logout</button>
              <Image
                src={avatarPlaceholder}
                alt="User Avatar"
                className={styles.profilePic}
                onClick={() => router.push('/profile')}
              />
            </>
          ) : (
            <>
              <button onClick={() => router.push('/login')} className={styles.loginButton}>Log In</button>
              <button onClick={() => router.push('/signup')} className={styles.signupButton}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* Search Header */}
      <header className={styles.searchHeader}>
        <input
          type="text"
          placeholder="Search blog posts, code templates, users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button onClick={handleSearch} className={styles.searchButton}>Search</button>
      </header>

      {/* Search Results */}
      <div className={styles.resultsContainer}>
        <h1 className={styles.resultsTitle}>Search Results for "{query}"</h1>

        {/* Users Section */}
        <section className={styles.resultsSection}>
          <h2>Users</h2>
          {results.users.length > 0 ? (
            <ul className={styles.resultsList}>
              {results.users.map((user) => (
                <li key={user.id} className={styles.resultItem}>
                  <h3 className={styles.resultItemTitle}>Username: {user.username}</h3>
                  <p>{user.firstName} {user.lastName}</p>
                  <p>Email: {user.email}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users found.</p>
          )}
        </section>

        {/* Blogs Section */}
        <section className={styles.resultsSection}>
          <h2>Blog Posts</h2>
          {results.blogs.length > 0 ? (
            <ul className={styles.resultsList}>
              {results.blogs.map((blog) => (
                <li key={blog.id} className={styles.resultItem}>
                  <h3 className={styles.resultItemTitle}>{blog.title}</h3>
                  <p>{blog.content}</p>
                  <p>Published on: {new Date(blog.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No blog posts found.</p>
          )}
        </section>

        {/* Code Templates Section */}
        <section className={styles.resultsSection}>
          <h2>Code Templates</h2>
          {results.codeTemplates.length > 0 ? (
            <ul className={styles.resultsList}>
              {results.codeTemplates.map((template) => (
                <li key={template.id} className={styles.resultItem}>
                  <h3 className={styles.resultItemTitle}>{template.title}</h3>
                  <p>{template.explanation}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No code templates found.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default SearchResults;