import React, { useState, useContext, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Image from 'next/image';

export default function Code() {
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
        <div className="h-screen flex flex-col bg-gray-100">
            <Navbar />
            
            <div className="flex-1 flex overflow-hidden">
                {/* Language Icons Sidebar */}
                <div className="w-16 bg-white shadow-lg p-2 flex flex-col space-y-4">
                    <button 
                        onClick={() => setLanguage('python')}
                        className={`p-2 rounded-lg transition-colors ${language === 'python' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        title="Python"
                    >
                        <Image 
                            src="/icons/python.png" 
                            alt="Python" 
                            width={32} 
                            height={32} 
                        />
                    </button>
                    <button 
                        onClick={() => setLanguage('java')}
                        className={`p-2 rounded-lg transition-colors ${language === 'java' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        title="Java"
                    >
                        <Image 
                            src="/icons/java.png" 
                            alt="Java" 
                            width={32} 
                            height={32} 
                        />
                    </button>
                    <button 
                        onClick={() => setLanguage('cpp')}
                        className={`p-2 rounded-lg transition-colors ${language === 'cpp' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        title="C++"
                    >
                        <Image 
                            src="/icons/cpp.png" 
                            alt="C++" 
                            width={32} 
                            height={32} 
                        />
                    </button>
                    <button 
                        onClick={() => setLanguage('c')}
                        className={`p-2 rounded-lg transition-colors ${language === 'c' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        title="C"
                    >
                        <Image 
                            src="/icons/c.png" 
                            alt="C" 
                            width={32} 
                            height={32} 
                        />
                    </button>
                    <button 
                        onClick={() => setLanguage('js')}
                        className={`p-2 rounded-lg transition-colors ${language === 'js' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        title="JavaScript"
                    >
                        <Image 
                            src="/icons/javascript.png" 
                            alt="JavaScript" 
                            width={32} 
                            height={32} 
                        />
                    </button>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Code Entry */}
                        <div className="h-[calc(100vh-120px)]">
                            <div className="h-10 px-4 bg-gray-100 text-gray-700 font-mono text-sm rounded-t-lg border border-gray-300 border-b-0 flex justify-between items-center">
                                <span>
                                    {language === 'python' && 'main.py'}
                                    {language === 'java' && 'Main.java'}
                                    {language === 'cpp' && 'main.cpp'}
                                    {language === 'c' && 'main.c'}
                                    {language === 'js' && 'script.js'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveTab(activeTab === 2 ? 1 : 2)}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${
                                            activeTab === 2 
                                                ? 'bg-gray-300 text-gray-700' 
                                                : 'px-3 py-1 text-sm rounded transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Stdin
                                    </button>
                                    {user && (
                                        <button
                                            onClick={handleSaveClick}
                                            disabled={!code.trim()}
                                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                                code.trim() 
                                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            Save
                                        </button>
                                    )}
                                    <button
                                        onClick={handleRunCode}
                                        className="px-3 py-1 text-sm rounded transition-colors bg-green-500 text-white hover:bg-green-600"
                                    >
                                        Run
                                    </button>
                                </div>
                            </div>
                            <div className="h-[calc(100%-40px)] relative">
                                <div className="h-full border border-gray-300 rounded-b-lg overflow-hidden">
                                    <div className="flex h-full">
                                        <div className="py-2 w-12 flex-none overflow-hidden bg-gray-50 border-r border-gray-300">
                                            <div className="font-mono text-sm text-gray-400 select-none" style={{ lineHeight: '20px' }}>
                                                {Array.from({ length: code.split('\n').length + 1 }, (_, i) => (
                                                    <div key={i} className="h-[20px] text-center">
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            ref={textareaRef}
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            onKeyDown={handleTab}
                                            className="flex-1 py-2 px-4 font-mono text-sm focus:outline-none resize-none overflow-auto"
                                            placeholder="Enter your code here..."
                                            style={{ lineHeight: '20px' }}
                                            onScroll={(e) => {
                                                const lineNumbers = e.currentTarget.previousSibling as HTMLElement;
                                                if (lineNumbers) {
                                                    lineNumbers.scrollTop = e.currentTarget.scrollTop;
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {activeTab === 2 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gray-100 border border-gray-300 p-4 rounded-b-lg">
                                        <input
                                            type="text"
                                            value={stdin}
                                            onChange={handleStdinChange}
                                            placeholder="Enter input..."
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Output */}
                        <div className="h-[calc(100vh-120px)]">
                            <div className="h-10 px-4 bg-gray-100 text-gray-700 font-mono text-sm rounded-t-lg border border-gray-300 border-b-0 flex justify-between items-center">
                                <span>Output</span>
                                <button
                                    onClick={() => {
                                        setOutput('');
                                        setError('');
                                    }}
                                    className="px-3 py-1 text-sm rounded transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="h-[calc(100%-40px)] border border-gray-300 rounded-b-lg bg-white flex flex-col overflow-hidden">
                                <textarea
                                    readOnly
                                    value={output || error}
                                    className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none overflow-auto ${
                                        error ? 'text-red-500' : 'text-gray-700'
                                    }`}
                                    placeholder="Output will appear here..."
                                />
                                {user && (
                                    <div className="p-4 border-t border-gray-300">
                                        <button 
                                            onClick={handleSaveClick}
                                            disabled={!code.trim()}
                                            className={`w-full py-2 rounded-md transition-colors ${
                                                code.trim() 
                                                    ? 'bg-green-500 text-white hover:bg-green-600' 
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            Save Code
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Template Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Save Template</h3>
                        
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="Template name"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            
                            <textarea
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                placeholder="Explanation (optional)"
                                className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                            
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Tags (comma-separated)"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={handleSaveCode}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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