// TODO: handle pagination

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import styles from './code-templates.module.css';
import Navbar from '../components/Navbar';
import { codeTemplate } from '@prisma/client';

interface CodeTemplate {
  id: number;
  title: string;
  explanation: string;
  tags: string[];
  language: string;
  content: string;
  fork: boolean;
  blogPost: BlogPost[];
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

interface Tag {
  id: number;
  name: string;
}

const CodeTemplates = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [templates, setTemplates] = useState<CodeTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CodeTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    explanation: '',
    tags: '',
    language: '',
    content: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createTemplate, setCreateTemplate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const router = useRouter();

  const handleRunCode = (template: codeTemplate) => {
    router.push({
      pathname: '/code',
      query: { code: template.content, language: template.language, id: template.id },
    });
  };

  const handleViewSaved = () => {
    router.push({
      pathname: '/saved-templates',
    })
  }

  // Fetch templates on load
  useEffect(() => {
    if (isLoggedIn) {
      fetchTemplates();
    }
    else {
      fetchTemplates();
    }
  }, [isLoggedIn, currentPage]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/code/template');
      const data = await response.json();
      if (response.ok) {
        setTemplates(data);
        setFilteredTemplates(data);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to fetch templates');
    }
  };
  

  // Handle the creation of a new template
  const handleCreateTemplate = async () => {
    setError('');
    setSuccessMessage('');
    try {
      // Retrieve token from local storage or context
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const { title, explanation, tags, language, content } = newTemplate;
      const response = await fetch('/api/code/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add Authorization header
        },
        body: JSON.stringify({ title, explanation, tags: tags.split(','), language, content }),
      });

      const data = await response.json();
      if (response.ok) {
        setTemplates([...templates, data]);
        setNewTemplate({ title: '', explanation: '', tags: '', language: '', content: '' });
        setSuccessMessage('Template created successfully!');
        setCreateTemplate(false)
      } else {
        setError(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template');
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const nextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const prevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleForkTemplate = async (id: number) => {
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const response = await fetch('/api/code/fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: id }),
      });

      const data = await response.json();
      if (response.ok) {
        setTemplates((prevTemplates) => [...prevTemplates, data]);
        setNewTemplate({ title: '', explanation: '', tags: '', language: '', content: '' });
        setSuccessMessage('Template forked successfully!');
        setCreateTemplate(false)
      } else {
        setError(data.error || 'Failed to fork template');
      }
    } catch (error) {
      console.error('Error forking template:', error);
      setError('Failed to fork template');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredTemplates(templates);
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const filtered = templates.filter(
      (template) =>
        template.title.toLowerCase().includes(lowerCaseQuery) ||
        template.explanation.toLowerCase().includes(lowerCaseQuery) ||
        template.tags.some((tag) => tag.name.toLowerCase().includes(lowerCaseQuery)) ||
        template.language.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredTemplates(filtered);
  };

  const handleSaveTemplate = async (id: number) => {
    setError('');
    setSuccessMessage('');
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
        setSuccessMessage('Template saved successfully!');
      }

    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    }
  }

  return (
    <div className={`${styles.blogBackground} h-[calc(100vh-64px)]`}>
      {/* Top Navigation */}
      <Navbar />

      <div className="container mx-auto px-4 py-8 bg-white shadow mt-8 rounded-lg">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
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
        <div className="flex justify-center items-center gap-6">
          <button
            onClick={() => setCreateTemplate(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-auto mb-6"
          >
            Create Template
          </button>
          {user && (          
            <button
              onClick={() => handleViewSaved()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-auto mb-6"
              >
              View Saved Templates
            </button>
          )}
        </div>

        {/* Templates */}
        <div className="bg-white shadow rounded-lg p-6 max-h-[calc(100vh-325px)] overflow-y-scroll">
          <div className="overflow-y-auto h-full">
            {(searchQuery ? filteredTemplates : templates).length === 0 ? (
              <p className="text-center text-gray-600 italic p-8">No templates available</p>
            ) : (
              <ul className="list-none p-0">
                {(searchQuery ? filteredTemplates : templates).map((template) => (
                  <li key={template.id} className="mb-6 p-4 border border-gray-300 rounded-lg transition hover:shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-gray-800 flex-1">
                        {template.title} <span className="text-gray-600 text-sm">{`(${template.language})`}</span>
                      </h4>
                      {template.fork && (
                        <p className="text-xs text-gray-600 ml-4">Forked</p>
                      )}
                    </div>
                    {template.explanation && (
                      <p className="mt-2 mb-2 text-gray-600">{template.explanation}</p>
                    )}
                    <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
                      <code>{template.content}</code>
                    </pre>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(template.tags || []).map((tag) => (
                        <span key={tag.id} className="text-blue-500 text-sm">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    {(template.blogPost || []).length > 0 && (
                      <p className="text-sm text-gray-500 mt-1"> Related Blog Posts: {template.blogPost.map((blogPost) => blogPost.title).join(', ')}</p>
                    )}
                    {/* Footer with Fork, Save, and Delete Buttons */}
                    <div className="flex gap-4 items-center mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleRunCode(template)}
                        className="text-sm text-gray-500 hover:text-[#1da1f2] transition-colors"
                      >
                        Run Code
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleForkTemplate(template.id)}
                        className="text-sm text-gray-500 hover:text-[#1da1f2] transition-colors"
                      >
                        Fork
                      </button>
                      
                      <button
                        onClick={() => handleSaveTemplate(template.id)}
                        className="text-sm text-gray-500 hover:text-[#1da1f2] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>



        {/*Create a New Template */}
        {createTemplate && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Create a New Template</h2>
              <input
                type="text"
                placeholder="Title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                placeholder="Explanation"
                value={newTemplate.explanation}
                onChange={(e) => setNewTemplate({ ...newTemplate, explanation: e.target.value })}
                className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newTemplate.tags}
                onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="Language"
                value={newTemplate.language}
                onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                placeholder="Code Content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 h-24"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setCreateTemplate(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeTemplates;
