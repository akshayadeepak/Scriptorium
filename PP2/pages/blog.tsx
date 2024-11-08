import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

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
  const [codeTemplate, setCodeTemplate] = useState<string>('');
  const [templateTitle, setTemplateTitle] = useState<string>('');
  const [codeTemplateTitle, setCodeTemplateTitle] = useState('');
  const [codeTemplateContent, setCodeTemplateContent] = useState('');
  const [codeTemplateLanguage, setCodeTemplateLanguage] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<CodeTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
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
      {showNewPostPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowNewPostPopup(false)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '1rem',
                border: 'none',
                background: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h3 style={{ 
              marginBottom: '1.5rem',
              fontSize: '1.2rem',
              fontWeight: 'bold' 
            }}>Create New Post</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Post content"
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}
              />
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#4a5568', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Tags
                </label>
                <select
                  multiple
                  value={selectedTags}
                  onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                  className="select-focus"
                  style={{
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #d2d6dc',
                    borderRadius: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    color: '#4a5568',
                    lineHeight: '1.25',
                    outline: 'none'
                  }}
                >
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.name} style={{ color: '#4a5568' }}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#4a5568', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Add Code Template (Optional)
                </label>
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #d2d6dc',
                    borderRadius: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    color: '#4a5568',
                    lineHeight: '1.25',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <option value="" style={{ color: '#4a5568' }}>Select a template</option>
                  {availableTemplates.map(template => (
                    <option key={template.id} value={template.id} style={{ color: '#4a5568' }}>
                      {template.title} ({template.language})
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'grey',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Create Post
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: '800px',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          fontWeight: 'bold' 
        }}>Blog Posts</h2>

        {user && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <button 
              onClick={() => setShowNewPostPopup(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'grey',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              New Post
            </button>
          </div>
        )}

        <div>
          {posts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'grey'
            }}>
              No posts available
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-4">By {post.author.username}</p>
                
                <div className="mb-2">
                  {post.tags.map(tag => (
                    <span 
                      key={tag.id}
                      className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
                
                <p className="mb-4">{post.content}</p>
                
                {post.links?.map(template => (
                  <div key={template.id} className="mb-4 bg-gray-100 p-4 rounded">
                    <h3 className="font-bold mb-2">{template.title}</h3>
                    <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                      <code>{template.content}</code>
                    </pre>
                  </div>
                ))}
                
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'grey',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '0.5rem'
                    }}
                  >
                    {selectedPost === post.id ? 'Hide Comments' : `Comments (${post.comments.length})`}
                  </button>
                  
                  {selectedPost === post.id && (
                    <div style={{ marginTop: '1rem' }}>
                      {user && (
                        <div style={{ marginBottom: '1rem' }}>
                          <textarea
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder="Write a comment..."
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              marginBottom: '0.5rem'
                            }}
                            rows={2}
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'grey',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Post Comment
                          </button>
                        </div>
                      )}
                      
                      {post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            style={{
                              padding: '0.5rem',
                              borderLeft: '2px solid #ddd',
                              marginBottom: '0.5rem'
                            }}
                          >
                            <p style={{ marginBottom: '0.25rem' }}>{comment.content}</p>
                            <small style={{ color: '#888' }}>
                              {comment.author.username} - {new Date(comment.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#888', fontStyle: 'italic' }}>No comments yet</p>
                      )}
                    </div>
                  )}
                </div>

                {user && (user.id === post.authorId || user.permission === 'ADMIN') && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleDeleteClick(post.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '0.5rem'
                      }}
                    >
                      Delete
                    </button>
                    {user.id === post.authorId && (
                      <button
                        onClick={() => {
                          setEditingPost(post);
                          setEditTitle(post.title);
                          setEditContent(post.content);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'blue',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          marginTop: '2rem'
        }}>
          <button 
            onClick={() => router.push('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'grey',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>

      {editingPost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2>Edit Post</h2>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                minHeight: '200px'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setEditTitle('');
                  setEditContent('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'grey',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleUpdatePost(editingPost.id, editingPost.authorId, {
                    title: editTitle,
                    content: editContent
                  });
                  setEditingPost(null);
                  setEditTitle('');
                  setEditContent('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'blue',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeletePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p>Are you sure you want to delete this post?</p>
            <button onClick={confirmDelete} style={{ marginRight: '10px' }}>Yes</button>
            <button onClick={() => setShowDeletePopup(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
} 