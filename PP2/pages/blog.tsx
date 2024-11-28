import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import styles from './blog.module.css';
import { useRouter } from 'next/router';
import { useTheme } from '../context/ThemeContext'; // Import ThemeContext

interface Comment {
  id: number;
  content: string;
  author: {
    id: number,
    username: string;
  };
  createdAt: string;
  hiddenFlag: boolean,
  parentCommentId?: number,
  childrenComments?: Comment[],
}

interface Tag {
  id: number;
  name: string;
  blogPosts: BlogPost[];
  _count: {
    blogPosts: number;
  };
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
  hiddenFlag: boolean,
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
  const [templateToFork, setTemplateToFork] = useState<CodeTemplate | null>(null);
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);
  const [forkedTemplateName, setForkedTemplateName] = useState('');
  const [forkedExplanation, setForkedExplanation] = useState('');
  const [forkedTags, setForkedTags] = useState('');
  const [isICROpen, setIsICROpen] = useState(false);
  const [ICRTitle, setICRTitle] = useState('');
  const [ICRExplanation, setICRExplanation] = useState('');
  const [templateToReport, setTemplateToReport] = useState<BlogPost | null>(null);
  const [commentToReport, setCommentToReport] = useState<Comment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<number, string>>({});
  const [replyBoxVisible, setReplyBoxVisible] = useState<Record<number, boolean>>({});
  const [showCommentInput, setShowCommentInput] = useState<Record<number, boolean>>({});
  const { isDarkMode, toggleDarkMode } = useTheme(); // Use the theme context
  

  const router = useRouter();


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
        console.log(data); // Log the fetched tags data
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const toggleCommentInput = (postId: number) => {
    setShowCommentInput(prev => ({
        ...prev,
        [postId]: !prev[postId] // Toggle the visibility for the specific post
    }));
};

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
  
  const handleReport = async () => {
    try {
      console.log(templateToReport);
      if (!ICRExplanation.trim()) { // Check if explanation is empty
          setError('Explanation is required to submit a report.'); // Set error message
          return; // Prevent further execution
      }
      if (templateToReport) {
        const response = await fetch('/api/blog/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blogPostId: templateToReport.id,
            content: ICRExplanation
          })
        });

        if (response.ok) {
          setTemplateToReport(null);
          setIsICROpen(false);
          setICRTitle('');
          setICRExplanation('');
        } else {
          console.error('Failed to report template');
        }
      } else if (commentToReport) {
        const response = await fetch('/api/blog/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ commentId: commentToReport.id, content: ICRExplanation })
        });

        if (response.ok) {
          setCommentToReport(null);
          setIsICROpen(false);
          setICRTitle('');
          setICRExplanation('');
        } else {
          console.error('Failed to report comment');
        }
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/blog', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
    });
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editTitle.trim() || !editContent.trim()) {
        console.error('Title and content are required');
        return;
    }

    // Prepare tags: split by comma, trim spaces, and filter out empty values
    const tagsToSubmit = selectedTags.map(tag => tag.trim()).filter(tag => tag);

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
                tags: tagsToSubmit, // Use the prepared tags
                templateId: selectedTemplateId
            })
        });

        if (response.ok) {
            const postData = await response.json(); // Get the created/updated post data

            // Update tags with the new post ID
            await Promise.all(tagsToSubmit.map(async (tag) => {
                const tagResponse = await fetch(`/api/tag`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: tag,
                        blogPosts: [postData.id] // Add the new post ID to the blogPosts array
                    })
                });

                if (!tagResponse.ok) {
                    const errorData = await tagResponse.json();
                    console.error('Error adding tag to blogPosts:', errorData.error);
                }
            }));

            // Clear inputs and close modal
            setTitle('');
            setContent('');
            setEditTitle('');
            setEditContent('');
            setSelectedTags([]); // Clear tags after submission
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
            // Update the posts state to include the new comment immediately
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { 
                            ...post, 
                            comments: [...post.comments, { 
                                id: data.id, 
                                content: commentContent, 
                                author: { id: user.id, username: user.username }, 
                                createdAt: new Date().toISOString(), 
                                hiddenFlag: false 
                            }] 
                        } 
                        : post
                )
            );
        }
    } catch (error) {
        console.error('Error posting comment:', error);
    }
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

  const handleRunCode = (template: CodeTemplate) => {
    router.push({
      pathname: '/code',
      query: { code: template.content, language: template.language, id: template.id },
    });
  };

  const handleForkTemplate = (template: CodeTemplate) => {
    setTemplateToFork(template);
    setIsForkModalOpen(true);
  };

  const handleSaveForkedTemplate = async () => {
    if (!templateToFork) return;

    const token = localStorage.getItem('token');
    const response = await fetch('/api/code/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: forkedTemplateName,
        explanation: forkedExplanation,
        tags: forkedTags.split(','),
        language: templateToFork.language,
        content: templateToFork.content,
      }),
    });

    if (response.ok) {
      const newTemplate = await response.json();
      setIsForkModalOpen(false);
      setForkedTemplateName('');
      setForkedExplanation('');
      setForkedTags('');
      setTemplateToFork(null);
    } else {
      const errorData = await response.json();
      setError(errorData.error || 'Failed to fork template');
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

  const handleSaveTemplate = async (id: number) => {

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const response = await fetch('/api/code/save', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: id }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Template saved successfully!');
      } else {
        setError(data.error || 'Failed to save template');
      }

    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    }
  }

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
            // Update the posts state to remove the deleted comment immediately
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { 
                            ...post, 
                            comments: post.comments.filter(comment => comment.id !== commentId) // Filter out the deleted comment
                          } 
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

  const handleHideReport = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const response = await fetch(`/api/blog?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hiddenFlag: true }),
      });

      if (response.ok) {
        const postsResponse = await fetch('/api/blog', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
        });
        const postsData = await postsResponse.json();
        setPosts(postsData);
        setFilteredBlogs(postsData);
      } else {
        setError('Error hiding post')
        console.log('Error')
      }
    } catch (error) {
      setError(`Error hiding report: ${error}`)
      console.log('Error')
    }
  }

  const handleUnHideReport = async (id: number) => {
      try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const response = await fetch(`/api/blog?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hiddenFlag: false }),
      });

      if (response.ok) {
        const postsResponse = await fetch('/api/blog', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
        });
        const postsData = await postsResponse.json();
        setPosts(postsData);
        setFilteredBlogs(postsData);
      } else {
        setError('Error hiding post')
        console.log('Error')
      }
    } catch (error) {
      setError(`Error hiding report: ${error}`)
      console.log('Error')
    }
  }

  const handleHideComment = async (id: number, commentId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const response = await fetch(`/api/blog/posts/${id}/comments?commentId=${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hiddenFlag: true }),
      });

      if (response.ok) {
        const postsResponse = await fetch('/api/blog', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
        });
        const postsData = await postsResponse.json();
        setPosts(postsData);
        setFilteredBlogs(postsData);
      } else {
        setError('Error hiding post')
        console.log('Error')
      }
    } catch (error) {
      setError(`Error hiding report: ${error}`)
      console.log('Error')
    }
  }

  const handleUnHideComment = async (id: number, commentId: number) => {
      try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const response = await fetch(`/api/blog/posts/${id}/comments?commentId=${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hiddenFlag: false }),
      });

      if (response.ok) {
        const postsResponse = await fetch('/api/blog', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
        });
        const postsData = await postsResponse.json();
        setPosts(postsData);
        setFilteredBlogs(postsData);
      } else {
        setError('Error hiding post')
        console.log('Error')
      }
    } catch (error) {
      setError(`Error hiding report: ${error}`)
      console.log('Error')
    }
  }

  const toggleReplyBox = (commentId: number) => {
    setReplyBoxVisible(prev => ({
        ...prev,
        [commentId]: !prev[commentId] // Toggle visibility for the specific comment
    }));
  };

  const handleReplyChange = (commentId: number, value: string) => {
    setReplyContent(prev => ({
        ...prev,
        [commentId]: value // Update content for the specific comment
    }));
  };

  const handleReplies = async (postId: number, commentId: number, replyContent: string) => {
    if (!user) return;
    if (!replyContent || replyContent.trim() === "") return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/blog/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: replyContent, parentId: commentId })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Reply error:', data.error);
            return;
        }

        // Update the posts state to include the new reply immediately
        setPosts(prevPosts => 
            prevPosts.map(post => 
                post.id === postId 
                    ? { 
                        ...post, 
                        comments: [
                            ...post.comments, 
                            { 
                                id: data.id, // Use the ID returned from the server
                                content: replyContent, 
                                author: { id: user.id, username: user.username }, 
                                createdAt: new Date().toISOString(), 
                                hiddenFlag: false, 
                                parentCommentId: commentId // Set the parent comment ID
                            } 
                        ] 
                    } 
                    : post
            )
        );

        // Clear the reply input
        setReplyContent('');
        setReplyBoxVisible(prev => ({
            ...prev,
            [commentId]: false // Set the specific comment's reply box to false
        }));
    } catch (error) {
        console.error('Error posting reply:', error);
    }
  };

  const handleSortByReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const sortBy = "reports"
      const response = await fetch(`/api/blog?sortBy=${sortBy}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts([...data]);
        setFilteredBlogs(data);
      } else {
        console.error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }

  return (
    <div className="h-screen overflow-hidden">
      <Navbar />
      <div
        className={`${styles.blogBackground} h-[calc(100vh-64px)] ${
          isDarkMode ? styles.darkMode : ''
        }`}
      >
      {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className={`fixed top-4 left-4 p-3 rounded-full shadow-md focus:outline-none ${
            isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <div className="px-4 h-full">
          <div className="grid grid-cols-6 gap-8 h-full">
            {/* Left Column - Tags */}
            <div className="col-span-1">
              <div
                className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-6 sticky top-8 h-[calc(100vh-112.5px)] mt-8 overflow-y-auto ${
                  isDarkMode ? 'bg-gray-800 text-gray-200' : ''
                }`}
              >
                <h2 className="text-xl font-bold text-gray-700 mb-4">Tags</h2>
                <div className="space-y-2">
                    {availableTags
                      .sort((a, b) => b._count.blogPosts - a._count.blogPosts) // Sort tags by number of blog posts in descending order
                      .map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group"
                          onClick={() => handleTagClick(tag.name)}  // Handle tag click to toggle filter
                        >
                          <span className={`text-gray-600 group-hover:text-[#1da1f2] ${activeTags.includes(tag.name) ? 'font-semibold' : ''}`}>
                            #{tag.name}
                          </span>
                          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {tag._count ? tag._count.blogPosts : 0}
                          </span>
                        </div>
                      ))}
                  </div>
              </div>
            </div>

            {/* Right Column - Posts */}
            <div className="col-span-5 py-8">
              {/* White box container */}
              <div
                className={`rounded-lg flex flex-col max-h-[calc(100vh-112.5px)] ${
                  isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'
                }`}
              >
                {/* Top Section - Search & Button */}
                <div
                  className={`p-6 border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
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

                  <div className="flex justify-center text-center gap-4">
                    <button 
                      onClick={handleNewPostClick}
                      className="px-6 py-3 bg-[#1da1f2] text-white border-none rounded-md cursor-pointer 
                               font-medium transition-all duration-300 hover:bg-[#00cfc1] hover:-translate-y-1"
                    >
                      New Post
                    </button>
                    {user && (
                      <button 
                      onClick={handleSortByReports}
                      className="px-6 py-3 bg-[#1da1f2] text-white border-none rounded-md cursor-pointer 
                               font-medium transition-all duration-300 hover:bg-[#00cfc1] hover:-translate-y-1"
                    >
                      Sort Posts by Reports
                    </button>
                    )}
                  </div>
                </div>

                {/* Bottom Section - Posts List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {[...filteredPosts].map((post) => (
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
                              <div className="flex items-center justify-between mb-2">
                              <h2 className="flex-1 text-xl text-gray-800 font-bold">
                                {post.title} {post.hiddenFlag && <span className="text-xs text-red-500">(hidden post)</span>}
                              </h2>
                                <div className="flex gap-4">
                                  {!post.hiddenFlag && (<button 
                                      onClick={() => {
                                        setTemplateToReport(post);
                                        setIsICROpen(true);
                                      }}
                                    className="text-sm text-gray-400 hover hover:text-red-400 hover:underline">
                                    Report
                                  </button>)}
                                  {user && !post.hiddenFlag && (
                                    <div>
                                      <button
                                        onClick={() => handleHideReport(post.id)}
                                        className="text-sm text-gray-400 hover hover:text-red-400 hover:underline">
                                        Hide
                                      </button>
                                    </div>
                                  )}
                                  {user && post.hiddenFlag && (
                                    <div>
                                      <button
                                        onClick={() => handleUnHideReport(post.id)}
                                        className="text-sm text-gray-400 hover hover:text-red-400 hover:underline">
                                        Unhide
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                                <div className="flex justify-between mb-2 text-gray-500 text-sm">
                                    <span>By {post.author.username}, {formatTimestamp(post.createdAt)}</span>
                                </div>
                                
                                {/* Display Tags */}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="my-2">
                                        {post.tags.map(tag => (
                                            <span key={tag.id} className="text-[#1da1f2] hover:underline cursor-pointer ml-2">
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Edit and Delete Buttons - Only show if the current user is the author */}
                                {user && user.id === post.author.id && (
                                    <div className="flex mb-5 space-x-2">
                                        {!post.hiddenFlag && (<button 
                                            onClick={() => handleEditPost(post)} 
                                            className="text-blue-500 hover:underline"
                                        >
                                            Edit
                                        </button>)}
                                        <button 
                                            onClick={() => handleDeletePost(post.id)} 
                                            className="text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                                <p className="text-gray-700 mb-4">{post.content}</p>

                                  {/* Render Code Template */}
                                  {post.links && post.links.length > 0 && (
                                  <div className="code-template mt-4">
                                    <h4 className="font-bold mb-2">{post.links[0].title} ({post.links[0].language})</h4>
                                    <pre className="bg-gray-100 p-2 rounded my-2">
                                      <code>{post.links[0].content.slice(0, 100)}...</code>
                                    </pre>
                                    <div className="flex gap-2 items-center mt-4 pt-4 border-t border-gray-100">
                                    <button
                                    onClick={() => handleRunCode(post.links[0])}
                                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                                  >
                                    Run Code
                                  </button>
                                  <button
                                    onClick={() => handleForkTemplate(post.links[0])}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                                  >
                                    Fork
                                  </button>
                                  <button
                                    onClick={() => handleSaveTemplate(post.links[0].id)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                                  >
                                    Save
                                  </button>
                                  </div>
                                  </div>
                                )}

                                {/* Toggle Comments Button */}
                                <button 
                                    onClick={() => toggleComments(post.id)} 
                                    className="text-[#1da1f2] mt-4 hover:underline mb-2"
                                >
                                    {post.comments.length > 0 
                                        ? `Comments (${post.comments.length})` 
                                        : 'No Comments'}
                                </button>

                                {/* Comments Section */}
                                {showComments[post.id] && (
                                  <div className="comments-section mt-4 border-t border-gray-200 pt-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Comments</h3>
                                    {showCommentInput[post.id] && (
                                      <div className="comment-input mt-4">
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

                                    {showCommentInput[post.id] ? (
                                      <button 
                                        onClick={() => toggleCommentInput(post.id)} 
                                        className="mb-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                                      >
                                        Cancel
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => toggleCommentInput(post.id)} 
                                        className="mb- px-4 py-2 bg-[#1da1f2] text-white rounded-md hover:bg-[#00cfc1] transition duration-200"
                                      >
                                        Add Comment
                                      </button>
                                    )}
                                    <hr className="my-4 border-gray-300" />

                                    {/* Render root comments and their children */}
                                    {post.comments.filter(comment => !comment.parentCommentId).length > 0 ? (
                                      post.comments
                                        .filter(comment => !comment.parentCommentId)
                                        .map(rootComment => (
                                          <div key={rootComment.id} className="comment mb-3 p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200">
                                            <p className="text-gray-800">
                                              <strong>{rootComment.author.username}</strong>
                                              {rootComment.hiddenFlag && <span className="ml-1 text-red-500">(hidden comment)</span>}: {rootComment.content}
                                              <span className="text-gray-500 text-sm ml-2">({formatTimestamp(rootComment.createdAt)})</span>
                                            </p>

                                            {/* Action buttons for root comments */}
                                            <div className="flex justify-end">
                                              {user && user.username === rootComment.author.username && (
                                                <>
                                                <button 
                                                onClick={() => handleEditComment(post.id, rootComment.id, prompt('Edit comment:', rootComment.content) || rootComment.content)} 
                                                className="px-3 py-1 ml-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
                                                  Edit
                                              </button>
                                              <button onClick={() => handleDeleteComment(post.id, rootComment.id)} className="px-3 py-1 ml-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm">Delete</button>
                                              </>
                                              )}
                                              {user && !rootComment.hiddenFlag && (
                                                <button onClick={() => handleHideComment(post.id, rootComment.id)} className="px-3 py-1 ml-2 bg-gray-300 text-white rounded-md hover:bg-gray-500 transition-colors text-sm">Hide</button>
                                              )}
                                              {user && rootComment.hiddenFlag && (
                                                <button onClick={() => handleUnHideComment(post.id, rootComment.id)} className="px-3 py-1 ml-2 bg-gray-300 text-white rounded-md hover:bg-gray-500 transition-colors text-sm">Unhide</button>
                                              )}
                                              {user && (
                                                <button onClick={() => toggleReplyBox(rootComment.id)} className="text-blue-500 hover:underline ml-2">Reply</button>
                                              )}
                                            </div>

                                            {/* Render reply input box */}
                                            {replyBoxVisible[rootComment.id] && (
                                              <div className="reply-input mt-2 ml-6">
                                                <textarea
                                                  value={replyContent[rootComment.id] || ''}
                                                  onChange={(e) => handleReplyChange(rootComment.id, e.target.value)}
                                                  placeholder="Write a reply..."
                                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none mb-3"
                                                />
                                                <button
                                                  onClick={() => handleReplies(post.id, rootComment.id, replyContent[rootComment.id])}
                                                  className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
                                                >
                                                  Submit Reply
                                                </button>
                                                <button
                                                  onClick={() => toggleReplyBox(rootComment.id)}
                                                  className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition ml-2"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            )}

                                            {/* Render children comments */}
                                            <div className="ml-6 mt-2">
                                              {(rootComment.childrenComments || []).map(childComment => (
                                                <div key={childComment.id} className="child-comment mb-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition duration-200">
                                                  <p className="text-gray-800">
                                                    <strong>{childComment.author.username}</strong>
                                                    {childComment.hiddenFlag && <span className="ml-1 text-red-500">(hidden comment)</span>}: {childComment.content}
                                                    <span className="text-gray-500 text-sm ml-2">({formatTimestamp(childComment.createdAt)})</span>
                                                  </p>
                                                  <div className="flex justify-end">
                                                    <button 
                                                      onClick={() => handleEditComment(post.id, childComment.id, prompt('Edit comment:', childComment.content) || childComment.content)} 
                                                      className="px-3 py-1 ml-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
                                                        Edit
                                                    </button>
                                                    {user && user.username === childComment.author.username && (
                                                      <button onClick={() => handleDeleteComment(post.id, childComment.id)} className="px-3 py-1 ml-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm">Delete</button>
                                                    )}
                                                    {user && !childComment.hiddenFlag && (
                                                      <button onClick={() => handleHideComment(post.id, childComment.id)} className="px-3 py-1 ml-2 bg-gray-300 text-white rounded-md hover:bg-gray-500 transition-colors text-sm">Hide</button>
                                                    )}
                                                    {user && childComment.hiddenFlag && (
                                                      <button onClick={() => handleUnHideComment(post.id, childComment.id)} className="px-3 py-1 ml-2 bg-gray-300 text-white rounded-md hover:bg-gray-500 transition-colors text-sm">Unhide</button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <p className="text-gray-500 my-4 text-center">No comments yet. Be the first to comment!</p>
                                    )}
                                  </div>
                                )}

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
                          onClick={() => {
                              setShowNewPostPopup(false);
                              setSelectedTags([]); // Clear tags when closing the modal
                              setEditTitle(''); // Clear title when closing the modal
                              setEditContent(''); // Clear content when closing the modal
                          }}
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

                      {/* Tags Input */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Enter Tags (comma separated)</label>
                          <input
                              type="text"
                              value={selectedTags.join(', ')} // Join selected tags for display
                              onChange={(e) => setSelectedTags(e.target.value.split(',').map(tag => tag.trim()))} // Split input into tags
                              placeholder="Enter tags..."
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent"
                          />
                          <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
                      </div>

                      {/* Code Template Selection */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Code Template</label>
                          <select
                              value={selectedTemplateId || ''}
                              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent transition duration-200"
                          >
                              <option value="" disabled>Select a template</option>
                              {availableTemplates.map(template => (
                                  <option key={template.id} value={template.id}>
                                      {template.title} ({template.language})
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

      {/* Fork Template Modal */}
      {isForkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Fork Template</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={forkedTemplateName}
                onChange={(e) => setForkedTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={forkedExplanation}
                onChange={(e) => setForkedExplanation(e.target.value)}
                placeholder="Explanation (optional)"
                className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <input
                type="text"
                value={forkedTags}
                onChange={(e) => setForkedTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleSaveForkedTemplate}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Fork
                </button>
                <button
                  onClick={() => {
                    setIsForkModalOpen(false);
                    setForkedTemplateName('');
                    setForkedExplanation('');
                    setForkedTags('');
                    setTemplateToFork(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ICR Modal */}
      {isICROpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Inappropriate Content Report</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={ICRTitle}
              onChange={(e) => setICRTitle(e.target.value)}
              placeholder="Report title"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={ICRExplanation}
              onChange={(e) => setICRExplanation(e.target.value)}
              placeholder="Explanation"
              className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleReport}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Report
              </button>
              <button
                onClick={() => {
                  setIsICROpen(false);
                  setICRTitle('');
                  setICRExplanation('');
                  setTemplateToReport(null);
                  setCommentToReport(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
} 