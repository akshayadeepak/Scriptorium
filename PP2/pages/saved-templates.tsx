import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import styles from './code-templates.module.css';
import Navbar from '../components/Navbar';
import { codeTemplate } from '@prisma/client';

interface CodeTemplate {
  id: number;
  authorId: number,
  title: string;
  explanation: string;
  tags: Tag[];
  language: string;
  content: string;
  fork: boolean;
  blogPost: BlogPost[];
  parentTemplateId: number,
  author?: {
    id: number;
    username: string;
  };
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
  id: number,
  name: string,
}

const SavedCodeTemplates = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [templates, setTemplates] = useState<CodeTemplate[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<CodeTemplate[]>([]);
  const [createTemplate, setCreateTemplate] = useState(false);
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);
  const [forkedTemplateName, setForkedTemplateName] = useState('');
  const [forkedExplanation, setForkedExplanation] = useState('');
  const [forkedTags, setForkedTags] = useState('');
  const [templateToFork, setTemplateToFork] = useState<CodeTemplate | null>(null);

  const router = useRouter();

  const handleRunCode = (template: codeTemplate) => {
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
        fork: true,
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

  const handleUnSaveTemplate = async (id: number) => {
    setError('');
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('Authorization token is missing. Please log in.');
            return;
        }

        const response = await fetch('/api/code/saved', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ templateId: id }),
        });

        const data = await response.json();
        if (response.ok) {
            setTemplates(templates.filter(template => template.id !== id));
            alert('Template unsaved successfully!');
        } else {
            setError(data.error || 'Failed to unsave template');
        }
    } catch (error) {
        console.error('Error unsaving template:', error);
        setError('Failed to unsave template');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTemplates();
    }
  }, [isLoggedIn])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authorization token is missing. Please log in.');
        return;
      }

      const response = await fetch('/api/code/saved', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredTemplates(templates);
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const filtered = templates.filter(template =>
      template.title.toLowerCase().includes(lowerCaseQuery) ||
      template.explanation.toLowerCase().includes(lowerCaseQuery) ||
      (template.tags && template.tags.some(tag => tag.name.toLowerCase().includes(lowerCaseQuery)))
    );
    setFilteredTemplates(filtered);
  };

  const nextPage = () => {
    if (filteredTemplates.length >= 10) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <Navbar />
      <div className={`${styles.blogBackground} overflow-hidden`}>

        <div className="container mx-auto px-4 pt-8 bg-white shadow mt-4 rounded-lg" style={{ maxWidth: '97.5%', marginBottom: '20px', paddingBottom: '20px' }}>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}

          <div className="flex items-center mb-4 justify-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Saved Templates</h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-6 py-4 text-lg border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1da1f2] focus:border-transparent transition-all duration-300 pl-14"
            />
          </div>

          {/* Templates */}
          <div className="bg-white shadow rounded-lg p-6 overflow-y-auto">
            <div className="overflow-y-auto h-96">
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
                      <div className="flex gap-2 items-center mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleRunCode(template)}
                          className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                          Run Code
                        </button>
                        <button
                          onClick={() => handleForkTemplate(template)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                        >
                          Fork
                        </button>
                        <button
                          onClick={() => handleUnSaveTemplate(template.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                        >
                          Unsave
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 p-4">
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

            {/* Fork Template Modal */}
        {isForkModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    </div>
  );
};

export default SavedCodeTemplates