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
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    explanation: '',
    tags: '',
    language: '',
    content: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      } else {
        setError(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template');
    }
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
    <div className={styles.pageContainer}>
      {/* Top Navigation */}
      <Navbar />

      <h1>Code Templates</h1>
      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <div className={styles.formSection}>
        <h2>Create a New Template</h2>
        <input
          type="text"
          placeholder="Title"
          value={newTemplate.title}
          onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
          className={styles.inputField}
        />
        <input
          type="text"
          placeholder="Explanation"
          value={newTemplate.explanation}
          onChange={(e) => setNewTemplate({ ...newTemplate, explanation: e.target.value })}
          className={styles.inputField}
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={newTemplate.tags}
          onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
          className={styles.inputField}
        />
        <input
          type="text"
          placeholder="Language"
          value={newTemplate.language}
          onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
          className={styles.inputField}
        />
        <textarea
          placeholder="Code Content"
          value={newTemplate.content}
          onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
          className={styles.textarea}
        />
        <button onClick={handleCreateTemplate} className={styles.createButton}>Create Template</button>
      </div>

      <div className={styles.templatesList}>
        <h2>My Templates</h2>
        {templates.length > 0 ? (
          templates.map(template => (
            <div key={template.id} className={styles.templateItem}>
              <h3>{template.title}</h3>
              <p>{template.explanation}</p>
              <p>Language: {template.language}</p>
              <button onClick={() => handleDeleteTemplate(template.id)} className={styles.deleteButton}>Delete</button>
            </div>
          ))
        ) : (
          <p>No templates found.</p>
        )}
      </div>
    </div>
  );
};

export default CodeTemplates;
