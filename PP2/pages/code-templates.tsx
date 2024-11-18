import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import styles from './code-templates.module.css';
import Navbar from '../components/Navbar';

// Add this interface at the top of the file, after the imports
interface CodeTemplate {
  id: number;
  title: string;
  explanation: string;
  tags: string[];
  language: string;
  content: string;
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

  // Fetch templates on load
  useEffect(() => {
    if (isLoggedIn) {
      fetchTemplates();
    }
  }, [isLoggedIn]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/code/template`);
      const data = await response.json();
      if (response.ok) {
        setTemplates(data);
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
        template.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery)) ||
        template.language.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredTemplates(filtered);
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      const response = await fetch(`/api/code/template?id=${id}`, {
        method: 'DELETE',
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

  return (
    <div className={`${styles.blogBackground} h-[calc(100vh-64px)]`}>
      {/* Top Navigation */}
      <Navbar />

      {/*Side Bar With Common Tags*/}
      {/*Search For Templates*/}

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-6">Code Templates</h1>
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
        <div className="flex justify-center items-center">
          <button
            onClick={() => setCreateTemplate(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-auto mb-6"
          >
            Create Template
          </button>
        </div>

        {/* Templates */}
        <div className="bg-white shadow rounded-lg p-6 mb-2">
          <h2 className="text-xl font-semibold mb-4">Templates</h2>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
              >
                <h3 className="text-lg font-semibold">{template.title}</h3>
                <p className="text-gray-600">{template.explanation}</p>
                <p className="text-gray-500 text-sm">Language: {template.language}</p>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-500 mt-2 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No templates found.</p>
          )}
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
