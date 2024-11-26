import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import logo from '../images/logo.jpg';
import placeholderPfp from '../images/placeholderpfp.webp';
import { useState } from 'react';

export default function Navbar() {
    const router = useRouter();
    const { user, avatar, logout } = useAuth();
    const isLoggedIn = !!user;
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        if (searchTerm.trim()) {
            router.push(`/search?query=${searchTerm}`);
        }
    };

    return (
        <header className="flex justify-between items-center p-2 md:p-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
                <Image 
                    src={logo} 
                    alt="Scriptorium Logo" 
                    className="w-8 h-auto cursor-pointer"
                />
                <span 
                    className="text-sm text-[#1da1f2] cursor-pointer p-1 hover:text-[#00cfc1] transition-colors" 
                    onClick={() => router.push('/')}
                >
                    Home
                </span>
                <span 
                    className="text-sm text-[#1da1f2] cursor-pointer p-1 hover:text-[#00cfc1] transition-colors" 
                    onClick={() => router.push('/blog')}
                >
                    Blog
                </span>
                <span 
                    className="text-sm text-[#1da1f2] cursor-pointer p-1 hover:text-[#00cfc1] transition-colors" 
                    onClick={() => router.push('/code')}
                >
                    Run Code
                </span>
                <span 
                    className="text-sm text-[#1da1f2] cursor-pointer p-1 hover:text-[#00cfc1] transition-colors" 
                    onClick={() => router.push('/code-templates')}
                >
                    Code Templates
                </span>
                <span 
                    className="text-sm text-[#1da1f2] cursor-pointer p-1 hover:text-[#00cfc1] transition-colors" 
                    onClick={() => router.push('/saved-templates')}
                >
                    Saved Templates
                </span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search blog posts, code templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-7 px-3 border border-gray-200 rounded focus:border-[#1da1f2] focus:outline-none w-[250px] text-sm transition-colors"
                    />
                    <button 
                        onClick={handleSearch} 
                        className="h-7 px-3 text-sm border border-[#1da1f2] rounded bg-transparent text-[#1da1f2] flex items-center justify-center hover:bg-[#00cfc1] hover:border-[#00cfc1] hover:text-white transition-all"
                    >
                        Search
                    </button>
                </div>
                {!isLoggedIn ? (
                    <div className="flex items-center gap-3">
                        <button 
                            className="h-7 px-3 text-sm border border-[#1da1f2] rounded bg-transparent text-[#1da1f2] flex items-center justify-center hover:bg-[#00cfc1] hover:border-[#00cfc1] hover:text-white transition-all"
                            onClick={() => router.push('/login')}
                        >
                            Log In
                        </button>
                        <button 
                            className="h-7 px-3 text-sm border border-[#1da1f2] rounded bg-[#1da1f2] text-white flex items-center justify-center hover:bg-[#00cfc1] hover:border-[#00cfc1] transition-all"
                            onClick={() => router.push('/signup')}
                        >
                            Sign Up
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button 
                            className="h-7 px-3 text-sm border border-[#1da1f2] rounded bg-transparent text-[#1da1f2] flex items-center justify-center hover:bg-[#00cfc1] hover:border-[#00cfc1] hover:text-white transition-all"
                            onClick={logout}
                        >
                            Log Out
                        </button>
                        <Image 
                            src={avatar || placeholderPfp} 
                            alt="User Avatar" 
                            width={24}
                            height={24}
                            className="cursor-pointer border border-gray-200"
                            onClick={() => router.push('/profile')} 
                        />
                    </div>
                )}
            </div>
        </header>
    );
} 