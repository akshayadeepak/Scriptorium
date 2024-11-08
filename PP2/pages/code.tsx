import React, { useState, useContext, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Code() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(1);
    const [stdin, setStdIn] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [tags, setTags] = useState('');
    const [explanation, setExplanation] = useState('');
    const { user } = useAuth();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSaveClick = () => {
        setIsModalOpen(true);
    };

    const handleSaveCode = async () => {
        if (!user) {
            setError('Please log in to save code');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            // First create any new tags
            const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
            for (const tagName of tagList) {
                if (tagName) {
                    await fetch('/api/tag', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name: tagName }),
                    });
                }
            }

            // Then save the code template
            const response = await fetch('/api/code/template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    language,
                    title: templateName,
                    content: code,
                    explanation,
                    tags: tagList,
                }),
            });

            if (response.ok) {
                setOutput('Code template saved successfully!');
                setIsModalOpen(false);
                setTemplateName('');
                setTags('');
                setExplanation('');
            } else {
                const errorData = await response.json();
                setError(errorData.error || response.statusText);
            }
        } catch (error) {
            console.error('Save error:', error);
            setError('Failed to save code template');
        }
    };

    const handleRunCode = async () => {
        setOutput('');
        setError('');

        try {
            const payload = {
                code,
                language,
                ...(activeTab === 2 && { stdin })
            };

            const response = await fetch('/api/code/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                setOutput(data.output);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to execute command');
            }
        } catch (error) {
            console.error('Execution error:', error);
            setError('Failed to execute command');
        }
    };

    const handleStdinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStdIn(e.target.value);
    };

    const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;
            
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            setCode(code.substring(0, start) + '    ' + code.substring(end));
            
            // Set cursor position after tab
            setTimeout(() => {
                if (textarea) {
                    textarea.selectionStart = textarea.selectionEnd = start + 4;
                }
            }, 0);
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
            <div style={{
                width: '100%',
                maxWidth: '1000px',
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    marginBottom: '1.5rem',
                    fontSize: '1.5rem',
                    fontWeight: 'bold' 
                }}>Code Editor</h2>

                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleTab}
                    style={{
                        width: '100%',
                        height: '300px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                    }}
                    placeholder="Enter your code here..."
                />

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <label style={{ fontWeight: '500' }}>Language:</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="c">C</option>
                        <option value="cpp">C++</option>
                        <option value="js">JavaScript</option>
                    </select>
                </div>

                <div style={{ 
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <button
                        onClick={() => setActiveTab(1)}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTab === 1 ? 'grey' : '#e0e0e0',
                            color: activeTab === 1 ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Simple Run
                    </button>
                    <button
                        onClick={() => setActiveTab(2)}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTab === 2 ? 'grey' : '#e0e0e0',
                            color: activeTab === 2 ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Provide Input
                    </button>
                </div>

                {activeTab === 1 ? (
                    <button
                        onClick={handleRunCode}
                        style={{
                            padding: '0.75rem 2rem',
                            backgroundColor: 'grey',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            marginBottom: '1.5rem'
                        }}
                    >
                        Run Code
                    </button>
                ) : (
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <input
                            type="text"
                            value={stdin}
                            onChange={handleStdinChange}
                            placeholder="Enter input..."
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                padding: '0.5rem',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                        <button
                            onClick={handleRunCode}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: 'grey',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Run with Input
                        </button>
                    </div>
                )}

                {output && (
                    <div style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Output:</h3>
                        <pre style={{ 
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>{output}</pre>
                    </div>
                )}

                {error && (
                    <div style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#ffebee',
                        borderRadius: '4px',
                        marginBottom: '1.5rem',
                        color: 'red'
                    }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Error:</h3>
                        <pre style={{ 
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>{error}</pre>
                    </div>
                )}

                <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginTop: '1rem'
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
                        Back
                    </button>
                    {user && (
                        <button 
                            onClick={handleSaveClick}
                            disabled={!code.trim()}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: code.trim() ? 'grey' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: code.trim() ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Save Code
                        </button>
                    )}
                </div>

                {/* Save Template Modal */}
                {isModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
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
                            <h3 style={{ 
                                marginBottom: '1.5rem',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                            }}>Save Template</h3>
                            
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="Template name"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginBottom: '1rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                            
                            <textarea
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                placeholder="Explanation (optional)"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginBottom: '1rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    minHeight: '100px'
                                }}
                            />
                            
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Tags (comma-separated)"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginBottom: '1.5rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                            
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '1rem'
                            }}>
                                <button
                                    onClick={handleSaveCode}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: 'grey',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setTemplateName('');
                                        setTags('');
                                        setExplanation('');
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#e0e0e0',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 