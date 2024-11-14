import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import styles from './blog.module.css';

interface Comment {
  id: number;
  content: string;
  author: {
    username: string;
  };
  createdAt: string;
}

interface Tag {
  id: number;
  name: string;
}

interface CodeTemplate {
  id: number;
  title: string;
  content: string;
  language: string;
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
  comments: Comment[];
  authorId: number;
  tags: Tag[];
  links: CodeTemplate[];
  rating: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showNewPostPopup, setShowNewPostPopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<CodeTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tag');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/code/template', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableTemplates(data);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation: Ensure title and content are not empty
    if (!title.trim() || !content.trim()) {
      console.error('Title and content are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          tags: selectedTags,
          templateId: selectedTemplateId
        })
      });

      if (response.ok) {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setSelectedTemplateId(null);
        setShowNewPostPopup(false);
        fetchPosts();
      } else {
        const errorData = await response.json();
        console.error('Error creating post:', errorData.error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleComment = async (postId: number) => {
    if (!user) return;
    if (!commentContent.trim()) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/blog/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: commentContent })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Comment error:', data.error);
            return;
        }

        if (response.ok) {
            setCommentContent('');
            fetchPosts(); // Refresh posts to show new comment
        }
    } catch (error) {
        console.error('Error posting comment:', error);
    }
};

  const handleDeleteClick = (postId: number) => {
    setPostToDelete(postId);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete || !user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/blog/posts/${postToDelete}?authorId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('Post deleted successfully');
        fetchPosts(); // Refresh the posts list
      } else {
        const data = await response.json();
        console.error('Delete error:', data.error);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setShowDeletePopup(false);
      setPostToDelete(null);
    }
  };

  const handleUpdatePost = async (postId: number, authorId: number, updates: any) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/blog/posts/${postId}?authorId=${authorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        console.log('Post updated successfully');
        fetchPosts(); // Refresh the posts list
      } else {
        const data = await response.json();
        console.error('Update error:', data.error);
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className={styles.blogBackground}>
        <div className="px-4">
          <div className="grid grid-cols-6 gap-8">
            {/* Left Column - Tags */}
            <div className="col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-6 sticky top-4 mt-4 mb-4 overflow-y-auto max-h-[calc(100vh-6rem)]">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Tags</h2>
                <div className="space-y-2">
                  {[
                    { name: "React", count: 24 },
                    { name: "Python", count: 18 },
                    { name: "JavaScript", count: 32 },
                    { name: "TypeScript", count: 15 },
                    { name: "CSS", count: 21 },
                    { name: "HTML", count: 19 },
                    { name: "Node.js", count: 14 },
                    { name: "Git", count: 12 },
                    { name: "Docker", count: 8 },
                    { name: "AWS", count: 11 },
                    { name: "Database", count: 16 },
                    { name: "API", count: 22 },
                    { name: "GraphQL", count: 9 },
                    { name: "DevOps", count: 13 },
                    { name: "Security", count: 7 },
                    { name: "Testing", count: 19 },
                    { name: "UI/UX", count: 15 },
                    { name: "Mobile", count: 11 },
                    { name: "Cloud", count: 14 },
                    { name: "Algorithms", count: 8 }
                  ].map((tag, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <span className="text-gray-600 group-hover:text-[#1da1f2]">#{tag.name}</span>
                      <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {tag.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>



            {/* Right Column - Posts */}
            <div className="col-span-5 pt-8">
              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search posts..."
                    className="w-full px-6 py-4 text-lg border border-gray-200 rounded-full shadow-sm 
                             focus:outline-none focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent
                             transition-all duration-300 pl-14"
                  />
                  <svg 
                    className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* New Post Button */}
              <div className="text-center mb-8">
                <button 
                  onClick={() => setShowNewPostPopup(true)}
                  className="px-6 py-3 bg-[#1da1f2] text-white border-none rounded-md cursor-pointer 
                           font-medium transition-all duration-300 hover:bg-[#00cfc1] hover:-translate-y-1"
                >
                  New Post
                </button>
              </div>

              {/* Posts List */}
              <div className="space-y-6">
                {[...posts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).map((post) => (
                  <div key={post.id} 
                    className="bg-white p-6 rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full"
                  >
                    <h2 className="text-xl text-gray-700 mb-2 font-bold">{post.title}</h2>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-500 text-sm">By {post.author.username}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(post.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map(tag => (
                        <span key={tag.id} 
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{post.content}</p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                        className="text-sm text-gray-500 hover:text-[#1da1f2] transition-colors"
                      >
                        {post.comments.length} comments
                      </button>
                      <span className="text-sm text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 