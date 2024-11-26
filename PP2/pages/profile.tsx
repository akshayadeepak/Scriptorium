import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/AuthGuard';
import Navbar from '@/components/Navbar';

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
    tags: Tag[];
    fork: boolean;
}

interface Tag {
    id: number,
    name: string,
}

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [templates, setTemplates] = useState<CodeTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editModal, setEditModal] = useState<CodeTemplate | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState('')


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

    const handleEditButtonClick = (template: CodeTemplate) => {
        setEditModal(template);
    };

    const handleDeleteTemplate = async (id: number) => {
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            setError('Authorization token is missing. Please log in.');
            return;
          }
    
          const response = await fetch(`/api/code/template?id=${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            },
          });
          if (response.ok) {
            setTemplates(templates.filter(template => template.id !== id));
          } else {
            const data = await response.json();
            setError(data.error || 'Failed to delete template');
          }
        } catch (error) {
          console.error('Error deleting template:', error);
          setError('Failed to delete template');
        }
      };

    const handleEditTemplate = async () => {
        if (!editModal) return;
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Authorization token is missing. Please log in.');
                return;
            }

            const response = await fetch(`/api/code/template?id=${editModal.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: editModal.id,
                    title: editModal.title,
                    explanation: editModal.explanation,
                    tags: tags.split(',').map(tag => tag.trim()),
                    language: editModal.language,
                    content: editModal.content,
                }),
            });

            if (response.ok) {
                const updatedTemplate = await response.json();
                setTemplates((prev) =>
                    prev.map((template) =>
                        template.id === updatedTemplate.id ? updatedTemplate : template
                    )
                );
                setEditModal(null);
                setSuccessMessage('Template updated successfully!');
            } else {
                setError('Failed to update template.');
            }
        } catch (error) {
            console.error('Error updating template:', error);
            setError('Failed to update template.');
        }
    };

    return (
        <AuthGuard>
            <div className="w-full min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" 
                 style={{ backgroundImage: "url('/banners/index.png')", position: 'relative' }}>
                <div className="absolute inset-0" 
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(5px)', zIndex: 0 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Navbar />
                    <div className="flex w-full p-4">
                        <div className="w-1/3 p-4 bg-white bg-opacity-80 rounded-l-lg shadow h-[88.5vh]">
                            <div className="flex justify-center">
                                <h2 className="text-center text-2xl font-bold text-gray-800 m-6">Profile</h2>
                            </div>
                            {profile.avatar ? (
                                <div className="flex justify-center mb-6 m-10">
                                    <img 
                                        src={profile.avatar} 
                                        alt="Profile" 
                                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                                    />
                                </div>
                            ) : (
                                <div className="flex justify-center mb-6">
                                    <span className="text-gray-600 italic">Avatar not set</span>
                                </div>
                            )}
                            <div className="mb-8">
                                <div className="p-4 border-b border-gray-300">
                                    <strong>Username:</strong> {profile.username}
                                </div>
                                <div className="p-4 border-b border-gray-300">
                                    <strong>Email:</strong> {profile.email}
                                </div>
                                <div className="p-4 border-b border-gray-300">
                                    <strong>Phone:</strong> {profile.phoneNumber || 'Not set'}
                                </div>
                                <div className="p-4 border-b border-gray-300">
                                    <strong>First name:</strong> {profile.firstName || 'Not set'}
                                </div>
                                <div className="p-4 border-b border-gray-300">
                                    <strong>Last name:</strong> {profile.lastName || 'Not set'}
                                </div>
                                <div className="flex justify-center">
                                    <button 
                                        onClick={() => router.push('/edit-profile')}
                                        className="px-6 py-3 m-7 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-2/3 p-4 bg-white bg-opacity-80 rounded-r-lg shadow h-[88.5vh] flex flex-col">
                            <div className="flex justify-center">
                                <h2 className="text-center text-2xl font-bold text-gray-800 m-6">My Code Templates</h2>
                            </div>
                            <div className="overflow-hidden flex-grow">
                                <div className="overflow-y-auto h-full">
                                    {templates.length === 0 ? (
                                        <p className="text-center text-gray-600 italic p-8">No templates available</p>
                                    ) : (
                                        <ul className="list-none p-0">
                                            {templates.map(template => (
                                                <li key={template.id} className="mb-6 p-4 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-lg font-bold text-gray-800 flex-1">
                                                            {template.title} <span className="text-gray-600 text-sm">{`(${template.language})`}</span>
                                                        </h4>
                                                        {template.fork && (
                                                            <p className="text-xs text-gray-600 ml-4">Forked</p>
                                                        )}
                                                    </div>
                                                    <pre className="bg-gray-200 p-2 rounded">
                                                        <code>{template.content}</code>
                                                    </pre>
                                                    {template.explanation && (
                                                        <p className="mt-2 text-gray-600">{template.explanation}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(template.tags || []).map(tag => (
                                                            <span key={tag.name} className="text-blue-500 text-sm">#{tag.name}</span>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-4 items-center mt-4 pt-4 border-t border-gray-100">
                                                        <button
                                                            onClick={() => handleEditButtonClick(template)}
                                                            className="text-sm text-gray-500 hover:text-[#1da1f2] transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                            className="text-sm text-gray-500 hover:text-[#1da1f2] transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {editModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-lg">
                                <h2 className="text-xl font-semibold mb-4">Edit Template</h2>
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={editModal.title}
                                    onChange={(e) =>
                                        setEditModal({ ...editModal, title: e.target.value })
                                    }
                                    className="w-full mb-4 p-2 border rounded"
                                />
                                <textarea
                                    placeholder="Explanation"
                                    value={editModal.explanation}
                                    onChange={(e) =>
                                        setEditModal({ ...editModal, explanation: e.target.value })
                                    }
                                    className="w-full mb-4 p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Tags (comma-separated)"
                                    value={
                                        Array.isArray(editModal.tags) 
                                            ? (editModal.tags || []).map((tag) => tag.name).join(',') 
                                            : editModal.tags
                                    }
                                    onChange={(e) => {
                                        setTags(e.target.value),
                                        setEditModal({
                                            ...editModal,
                                        });
                                    }}
                                    className="w-full mb-4 p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Language"
                                    value={editModal.language}
                                    onChange={(e) =>
                                        setEditModal({ ...editModal, language: e.target.value })
                                    }
                                    className="w-full mb-4 p-2 border rounded"
                                />
                                <textarea
                                    placeholder="Code Content"
                                    value={editModal.content}
                                    onChange={(e) =>
                                        setEditModal({ ...editModal, content: e.target.value })
                                    }
                                    className="w-full mb-4 p-2 border rounded h-24"
                                />
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setEditModal(null)}
                                        className="bg-gray-300 px-4 py-2 rounded mr-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEditTemplate}
                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
};

export default Profile;
