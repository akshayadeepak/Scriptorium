import React, { useState, useEffect } from 'react';
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
  blogPosts: BlogPost[];
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
  ratings: number;
}

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(); // Adjust format as needed
};

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
  const [showConfirmDeletePopup, setShowConfirmDeletePopup] = useState(false);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});


  useEffect(() => {
    const initializePosts = async () => {
      try {
        const response = await fetch('/api/blog');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
          // Initialize votes state with current post ratings
          const initialVotes = data.reduce((acc: Record<number, number>, post: BlogPost) => {
            acc[post.id] = post.ratings || 0;
            return acc;
          }, {});
          setVotes(initialVotes);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    initializePosts();
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

  const handleTagClick = (tagName: string) => {
    setActiveTags((prevActiveTags) => {
      if (prevActiveTags.includes(tagName)) {
        // Remove tag if it is already active
        return prevActiveTags.filter((tag) => tag !== tagName);
      } else {
        // Add tag to active list if not active
        return [...prevActiveTags, tagName];
      }
    });
  };
  

  
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

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
        // Initialize votes state with current post ratings
        const initialVotes = data.reduce((acc: Record<number, number>, post: BlogPost) => {
          acc[post.id] = post.ratings || 0;
          return acc;
        }, {});
        setVotes(initialVotes);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editTitle.trim() || !editContent.trim()) {
        console.error('Title and content are required');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const method = editingPost ? 'PUT' : 'POST';
        const url = editingPost ? `/api/blog/posts/${editingPost.id}` : '/api/blog';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: editTitle,
                content: editContent,
                tags: selectedTags,
                templateId: selectedTemplateId
            })
        });

        if (response.ok) {
            setTitle('');
            setContent('');
            setEditTitle('');
            setEditContent('');
            setSelectedTags([]);
            setSelectedTemplateId(null);
            setShowNewPostPopup(false);
            await fetchPosts();
        } else {
            const errorData = await response.json();
            console.error('Error creating/updating post:', errorData.error);
        }
    } catch (error) {
        console.error('Error creating/updating post:', error);
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
            // Update the posts state to include the new comment
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { ...post, comments: [...post.comments, { id: data.id, content: commentContent, author: { username: user.username }, createdAt: new Date().toISOString() }] } 
                        : post
                )
            );
        }
    } catch (error) {
        console.error('Error posting comment:', error);
    }
};

  const handleDeleteClick = (postId: number) => {
    setPostToDelete(postId);
    setShowConfirmDeletePopup(true);
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
        await fetchPosts(); // Refresh the posts list after deleting a post
      } else {
        const data = await response.json();
        console.error('Delete error:', data.error);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setShowConfirmDeletePopup(false); // Close confirmation popup
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
        setPosts(prevPosts => [...prevPosts]); // Refresh the posts list
      } else {
        const data = await response.json();
        console.error('Update error:', data.error);
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);


    const lowerCaseQuery = query.toLowerCase();
      const filtered = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(lowerCaseQuery) ||
          post.content.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredBlogs(filtered);
    };

  const handleNewPostClick = () => {
    if (!user) {
      console.error('Please log in to create a post');
      return;
    }
    setShowNewPostPopup(true);
  };

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const currentRating = votes[postId] || 0;
      const newRating = voteType === 'up' ? currentRating + 1 : currentRating - 1;

      // Update local state immediately for responsive UI
      setVotes(prev => ({
        ...prev,
        [postId]: newRating
      }));

      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'rate',
          rating: newRating
        })
      });

      if (!response.ok) {
        // Revert the local state if the server request fails
        setVotes(prev => ({
          ...prev,
          [postId]: currentRating
        }));
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      // Revert the local state on error
      setVotes(prev => ({
        ...prev,
        [postId]: votes[postId] || 0
      }));
    }
  };

  const filteredPosts = posts.filter((post) => {
    // If no active tags, show all posts
    if (activeTags.length === 0) return true;
  
    // Check if the post contains any of the active tags
    return post.tags.some((tag) => activeTags.includes(tag.name));
  });

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setShowNewPostPopup(true);
  };

  const handleDeletePost = async (postId: number) => {
    setPostToDelete(postId);
    setShowConfirmDeletePopup(true);
  };

  const toggleComments = (postId: number) => {
    setShowComments(prev => ({
        ...prev,
        [postId]: !prev[postId] // Toggle the visibility of comments for the specific post
    }));
  };

  const handleEditComment = async (postId: number, commentId: number, newContent: string) => {
    if (!user) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/blog/posts/${postId}/comments?commentId=${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: newContent })
        });

        if (response.ok) {
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? {
                            ...post,
                            comments: post.comments.map(comment => 
                                comment.id === commentId ? { ...comment, content: newContent } : comment
                            )
                        } 
                        : post
                )
            );
        } else {
            const data = await response.json();
            console.error('Edit comment error:', data.error);
        }
    } catch (error) {
        console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!user) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/blog/posts/${postId}/comments?commentId=${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { ...post, comments: post.comments.filter(comment => comment.id !== commentId) } 
                        : post
                )
            );
        } else {
            const data = await response.json();
            console.error('Delete comment error:', data.error);
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <Navbar />
      <div className={`${styles.blogBackground} h-[calc(100vh-64px)]`}>
        <div className="px-4 h-full">
          <div className="grid grid-cols-6 gap-8 h-full">
            {/* Left Column - Tags */}
            <div className="col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-6 sticky top-8 h-[calc(100vh-112.5px)] mt-8 overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Tags</h2>
                <div className="space-y-2">
                    {availableTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => handleTagClick(tag.name)}  // Handle tag click to toggle filter
                      >
                        <span className={`text-gray-600 group-hover:text-[#1da1f2] ${activeTags.includes(tag.name) ? 'font-semibold' : ''}`}>
                          #{tag.name}
                        </span>
                        <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          {tag.blogPosts && Array.isArray(tag.blogPosts) ? tag.blogPosts.length : 0}
                        </span>
                      </div>
                    ))}
                  </div>
              </div>
            </div>

            {/* Right Column - Posts */}
            <div className="col-span-5 py-8">
              {/* White box container */}
              <div className="bg-white rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-112.5px)]">
                {/* Top Section - Search & Button */}
                <div className="p-6 border-b border-gray-200">
                  <div className="relative max-w-2xl mx-auto mb-6">
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

                  <div className="text-center">
                    <button 
                      onClick={handleNewPostClick}
                      className="px-6 py-3 bg-[#1da1f2] text-white border-none rounded-md cursor-pointer 
                               font-medium transition-all duration-300 hover:bg-[#00cfc1] hover:-translate-y-1"
                    >
                      New Post
                    </button>
                  </div>
                </div>

                {/* Bottom Section - Posts List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {[...filteredPosts].sort((a, b) => (b.ratings || 0) - (a.ratings || 0)).map((post) => (
                        <div key={post.id} className="post-container bg-white rounded-lg shadow-md p-4 flex">
                            {/* Voting Section */}
                            <div className="flex flex-col items-center gap-1 mr-4">
                                <button 
                                    onClick={() => user ? handleVote(post.id, 'up') : null}
                                    className={`p-1 rounded ${
                                        !user 
                                            ? 'text-gray-300 cursor-not-allowed' 
                                            : votes[post.id] > 0 
                                                ? 'text-[#1da1f2] hover:bg-gray-100' 
                                                : 'text-gray-400 hover:bg-gray-100'
                                    } transition-colors`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                
                                <span className="font-medium text-gray-700">
                                    {votes[post.id] || 0}
                                </span>
                                
                                <button 
                                    onClick={() => user ? handleVote(post.id, 'down') : null}
                                    className={`p-1 rounded ${
                                        !user 
                                            ? 'text-gray-300 cursor-not-allowed' 
                                            : votes[post.id] < 0 
                                                ? 'text-[#1da1f2] hover:bg-gray-100' 
                                                : 'text-gray-400 hover:bg-gray-100'
                                    } transition-colors`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Post Content */}
                            <div className="flex-1">
                                <h2 className="text-xl text-gray-800 font-bold">{post.title}</h2>
                                <div className="flex justify-between mb-2 text-gray-500 text-sm">
                                    <span>By {post.author.username}, {formatTimestamp(post.createdAt)}</span>
                                </div>
                                {/* Edit and Delete Buttons - Only show if the current user is the author */}
                                {user && user.id === post.author.id && (
                                    <div className="flex mb-5 space-x-2">
                                        <button 
                                            onClick={() => handleEditPost(post)} 
                                            className="text-blue-500 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeletePost(post.id)} 
                                            className="text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                                <p className="text-gray-700 mb-4">{post.content}</p>

                                {/* Toggle Comments Button */}
                                <button 
                                    onClick={() => toggleComments(post.id)} 
                                    className="text-[#1da1f2] hover:underline mb-2"
                                >
                                    {post.comments.length > 0 
                                        ? `Comments (${post.comments.length})` 
                                        : 'No Comments'}
                                </button>
                                 {/* Comments Section */}
                            {showComments[post.id] && (
                                <div className="comments-section mt-4 border-t border-gray-200 pt-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Comments</h3>
                                    {post.comments.length > 0 ? (
                                        post.comments.map(comment => (
                                            <div key={comment.id} className="comment mb-3 p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200 flex justify-between">
                                                <div className="flex-1">
                                                    <p className="text-gray-800"><strong>{comment.author.username}</strong>: {comment.content}</p>
                                                </div>
                                                <p className="text-gray-500 text-sm ml-4 self-center">{formatTimestamp(comment.createdAt)}</p>
                                                <button onClick={() => handleEditComment(post.id, comment.id, prompt('Edit comment:', comment.content) || comment.content)} className="text-blue-500 hover:underline ml-2">Edit</button>
                                                <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-red-500 hover:underline ml-2">Delete</button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 my-2">No comments yet.</p>
                                    )}
                                    <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="comment-input w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent resize-none"
                                    />
                                    <button 
                                        onClick={() => handleComment(post.id)} 
                                        className="submit-comment-button my-4 px-4 py-2 bg-[#1da1f2] text-white rounded-md hover:bg-[#00cfc1] transition duration-200"
                                    >
                                        Submit Comment
                                    </button>
                                </div>
                            )}

                                {/* Render Comments if toggled */}
                                {showComments[post.id] && post.comments.map(comment => (
                                    <div key={comment.id} className="mt-2">
                                        <p className="text-gray-600">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

              </div>
            </div>
          </div>


      {/* New Post Popup Modal */}
      {showNewPostPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-700">
                          {editingPost ? 'Edit Post' : 'Create New Post'}
                      </h3>
                      <button 
                          onClick={() => setShowNewPostPopup(false)}
                          className="text-gray-500 hover:text-gray-700"
                      >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <input
                              type="text"
                              value={editTitle || title}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Post title"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent"
                              required
                          />
                      </div>

                      <div>
                          <textarea
                              value={editContent || content}
                              onChange={(e) => setEditContent(e.target.value)}
                              placeholder="Write your post..."
                              className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent resize-none"
                              required
                          />
                      </div>

                      <div>
                          <select
                              multiple
                              value={selectedTags}
                              onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent"
                          >
                              {availableTags.map(tag => (
                                  <option key={tag.id} value={tag.name}>
                                      {tag.name}
                                  </option>
                              ))}
                          </select>
                          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tags</p>
                      </div>

                      {/* Code template */}
                      <div>
                          <select
                              value={selectedTags}
                              onChange={(e) => setSelectedTemplateId(Number(e.target.id))}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent"
                          >
                              {availableTemplates.map(template => (
                                  <option key={template.id} value={template.title}>
                                      {template.title}
                                  </option>
                              ))}
                          </select>
                      </div> 
                      

                      <div className="flex justify-end space-x-3">
                          <button
                              type="button"
                              onClick={() => setShowNewPostPopup(false)}
                              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                          >
                              Cancel
                          </button>
                          <button
                              type="submit"
                              className="px-4 py-2 bg-[#1da1f2] text-white rounded-md hover:bg-[#1a91da] transition-colors"
                          >
                              {editingPost ? 'Update Post' : 'Create Post'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Confirmation Delete Popup Modal */}
      {showConfirmDeletePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-700">Confirm Delete</h3>
                  <p className="text-gray-600">Are you sure you want to delete this post?</p>
                  <div className="flex justify-end space-x-3 mt-4">
                      <button
                          onClick={() => setShowConfirmDeletePopup(false)} // Close popup without deleting
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                          Cancel
                      </button>
                      <button
                          onClick={confirmDelete} // Confirm delete action
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                          Delete
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
} 