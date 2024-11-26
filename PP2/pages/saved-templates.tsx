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

  const router = useRouter();

  const handleRunCode = (template: codeTemplate) => {
    router.push({
      pathname: '/code',
      query: { code: template.content, language: template.language, id: template.id },
    });
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
        setSuccessMessage('Template forked successfully!');
      } else {
        setError(data.error || 'Failed to fork template');
      }
    } catch (error) {
      console.error('Error forking template:', error);
      setError('Failed to fork template');
    }
  };

  const handleUnSaveTemplate = async (id: number) => {
    setError('');
    setSuccessMessage('');
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
        setSuccessMessage('Template unsaved successfully!');
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

  return (
    <div className={`${styles.blogBackground} h-[calc(100vh-64px)]`}>
      {/* Top Navigation */}
      <Navbar />

      <div className="container mx-auto px-4 py-8 bg-white mt-8 rounded-lg">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
        <h1 className="text-center text-2xl font-bold text-gray-800 mb-6">Saved Templates</h1>
        <div className="flex justify-center items-center gap-6">
          <button
            onClick={() => router.push('/code-templates')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-auto mb-6"
          >
            Back
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 max-h-[calc(100vh-325px)] overflow-y-scroll">
          <div className="overflow-y-auto h-full">
            {(templates).length === 0 ? (
              <p className="text-center text-gray-600 italic p-8">No templates available</p>
            ) : (
              <ul className="list-none p-0">
                {(templates).map((template) => (
                  <li key={template.id} className="mb-6 p-4 border border-gray-300 rounded-lg transition hover:shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-gray-800 flex-1">
                        {template.title} <span className="text-gray-600 text-sm">{`(${template.language})`}</span>
                      </h4>
                      {template.fork && (
                        <p className="text-xs text-gray-600 ml-4">Forked</p>
                      )}
                    </div>
                    <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
                      <code>{template.content}</code>
                    </pre>
                    {template.explanation && (
                      <p className="mt-2 text-gray-600">{template.explanation}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(template.tags || []).map((tag) => (
                        <span key={tag.id} className="text-blue-500 text-sm">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    {/* {template.blogPost.length > 0 && (
                      <p>Related Blog Posts: {template.blogPost.map((blogPost) => blogPost.title).join(', ')}</p>
                    )} */}
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
                        onClick={() => handleUnSaveTemplate(template.id)}
                        className="text-sm text-gray-500 hover:text-[#1da1f2] transition-colors"
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

      </div>
    </div>
  )

}

export default SavedCodeTemplates