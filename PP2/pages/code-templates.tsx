import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from './code-templates.module.css';
import Navbar from '../components/Navbar';
import { codeTemplate } from '@prisma/client';
import { useTheme } from '../context/ThemeContext'; // Import ThemeContext

interface CodeTemplate {
  id: number;
  authorId: number;
  author: {
    id: number;
    username: string;
  };
  title: string;
  explanation: string;
  tags: Tag[];
  language: string;
  content: string;
  fork: boolean;
  blogPost: BlogPost[];
  parentTemplateId: number;
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
  const [searchBy, setSearchBy] = useState('title');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createTemplate, setCreateTemplate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);
  const [forkedTemplateName, setForkedTemplateName] = useState('');
  const [forkedExplanation, setForkedExplanation] = useState('');
  const [forkedTags, setForkedTags] = useState('');
  const [templateToFork, setTemplateToFork] = useState<CodeTemplate | null>(null);
  const { isDarkMode, toggleDarkMode } = useTheme(); // Use the theme context

  const router = useRouter();

  const handleRunCode = (template: codeTemplate) => {
    router.push({
      pathname: '/code',
      query: { code: template.content, language: template.language, id: template.id },
    });
  };

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
      const response = await fetch(`/api/code/template?page=${currentPage}`);
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

  const nextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const prevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
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
      setTemplates((prevTemplates) => [...prevTemplates, newTemplate]);
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

  const handleSearch = async (query: string, searchBy: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredTemplates(templates);
      return;
    }

    const response = await fetch('/api/code/template');
    const data: CodeTemplate[] = await response.json();
    const lowerCaseQuery = query.toLowerCase();
    let filtered: CodeTemplate[] = [];

    if (searchBy === 'title') {
      filtered = data.filter(template =>
        template.title.toLowerCase().includes(lowerCaseQuery)
      );
    } else if (searchBy === 'tags') {
      filtered = data.filter(template =>
        template.tags.some(tag => tag.name.toLowerCase().includes(lowerCaseQuery))
      );
    } else if (searchBy === 'content') {
      filtered = data.filter(template =>
        template.content.toLowerCase().includes(lowerCaseQuery)
      );
    } else if (searchBy === 'all') {
      filtered = data.filter(template =>
        template.title.toLowerCase().includes(lowerCaseQuery) ||
        template.content.toLowerCase().includes(lowerCaseQuery) ||
        template.tags.some(tag => tag.name.toLowerCase().includes(lowerCaseQuery))
      );
    }

    setFilteredTemplates(filtered);
    setCurrentPage(1); // Reset to the first page on new search
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
        alert('Template saved successfully!');
      } else {
        setError(data.error || 'Failed to save template');
      }

    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    }
  }

  return (
    <div className={`h-screen overflow-hidden ${isDarkMode ? styles.darkMode : ''}`}>
      <Navbar />
      <div className={`${styles.blogBackground} overflow-hidden`}>
        
        <div className="container mx-auto px-4 pt-8 bg-white shadow mt-4 rounded-lg" style={{ maxWidth: '97.5%', paddingBottom: '20px' }}>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}

          <div className="flex items-center mb-4 justify-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Code Templates</h1>
          </div>

          {/* Search Bar */}
          <div className="flex items-center mb-4 justify-center"></div>
          <div className="relative mb-6 flex items-center space-x-4 p-6">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value, searchBy)}
                className="w-full px-6 py-4 text-lg border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent transition-all duration-300 pl-14"
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

          <div className="flex items-center mb-4 justify-center">
            <p className="mr-2">Search by:</p>
            <select
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value);
                handleSearch(searchQuery, e.target.value);
              }}
              className="border border-gray-200 rounded-md p-2"
            >
              <option value="all">All</option>
              <option value="title">Title</option>
              <option value="tags">Tags</option>
              <option value="content">Content</option>
            </select>
          </div>

          {/* Templates */}
          <div className="bg-white shadow rounded-lg p-6 overflow-y-auto">
            <div className="overflow-y-auto max-h-[calc(100vh-32rem)]">
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
                      <p className="text-sm text-gray-500">Author: {template.author ? template.author.username : 'Unknown'}</p>
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
                      <div className="flex flex-wrap mt-2">
                        {template.blogPost.length > 0 && (
                          <p className='text-sm text-gray-500'>Relevant Blog Posts: {template.blogPost.map((post) => post.title).join(', ')}</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleRunCode(template)}
                          className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                        >
                          Run Code
                        </button>
                        <button
                          onClick={() => handleForkTemplate(template)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                          Fork
                        </button>
                        <button
                          onClick={() => handleSaveTemplate(template.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
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

          {/* Pagination Controls */}
          <div className="bg-white border-t border-gray-300 p-4 fixed bottom-0 left-0 w-full mt-4 p-4 flex justify-between z-10">
            <button
              onClick={prevPage}
              className={`px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage}</span>
            <button
              onClick={nextPage}
              className={`px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 ${filteredTemplates.length < 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={filteredTemplates.length < 10}
            >
              Next
            </button>
          </div>

          {/* Create a New Template */}
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
        </div>
      </div>
    </div>
  );
};

export default CodeTemplates;
