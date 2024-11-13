import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';
import placeholderPfp from '../images/placeholderpfp.webp';

export default function Navbar() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const isLoggedIn = !!user;

    return (
        <nav className={styles.topNav}>
            <button 
                onClick={() => router.push('/')}
                className={styles.backButton}
            >
                Back to Homepage
            </button>
            <div className={styles.authButtons}>
                {isLoggedIn ? (
                    <>
                        <button 
                            onClick={logout}
                            className={styles.logoutButton}
                        >
                            Logout
                        </button>
                        <Image
                            src={placeholderPfp}
                            alt="User Avatar"
                            width={40}
                            height={40}
                            className={styles.profilePic}
                            onClick={() => router.push('/profile')}
                        />
                    </>
                ) : (
                    <>
                        <button 
                            onClick={() => router.push('/login')}
                            className={styles.navButton}
                        >
                            Log In
                        </button>
                        <button 
                            onClick={() => router.push('/signup')}
                            className={styles.signupButton}
                        >
                            Sign Up
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
} 