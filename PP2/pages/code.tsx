import React, { useState, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Image from 'next/image';
import styles from './code.module.css';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { javascript } from '@codemirror/lang-javascript';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';

  export default function Code() {
    const { query } = useRouter();
    const [priorTemplateId, setPriorTemplateId] = useState<number | null>(null);
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
    const [timeoutDuration, setTimeoutDuration] = useState<number | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (query.code) {
            setCode(query.code as string);
        }
        if (query.language) {
            setLanguage(query.language as string);
        }
        if (query.id) {
            setPriorTemplateId(parseInt(query.id as string))
        }
    }, [query]);

    const handleSaveClick = async () => {
        if (priorTemplateId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/code/template?id=${priorTemplateId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        id: priorTemplateId,
                        content: code,
                    }),
                });

                if (response.ok) {
                    setOutput('Code template edited successfully!');
                    setTemplateName('');
                    setTags('');
                    setExplanation('');
                } else if (response.status === 403) {
                    setIsModalOpen(true);
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || response.statusText);
                }
            } catch (error) {
                console.error('Save error:', error);
                setError('Failed to save code template');
            }
        } else {setIsModalOpen(true)};
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

            let forked = false;
            if (priorTemplateId) {
                forked = true;
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
                    fork: forked,
                }),
            });

            if (response.ok) {
                const responseData = await response.json();
                setPriorTemplateId(responseData.id);
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
        console.log("Running code...");
        setOutput('');
        setError('');

        try {
            const payload = {
                code,
                language,
                timeout: timeoutDuration ? timeoutDuration * 1000 : undefined,
                ...(activeTab === 2 && { stdin })
            };

            console.log("Payload to send:", payload);

            const response = await fetch('/api/code/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log("Response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("Response data:", data);
                setOutput(data.output);
            } else {
                const errorData = await response.json();
                console.error("Error data:", errorData);
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

    // Language-specific syntax checkers
    const pythonChecker = (view: any) => {
        const diagnostics: Diagnostic[] = [];
        const text = view.state.doc.toString();
        
        // Check for basic Python syntax errors
        const lines = text.split('\n');
        lines.forEach((line: string, index: number) => {
            const trimmed = line.trim();
            
            // Check print statement syntax
            if (trimmed.startsWith('print ') && !trimmed.startsWith('print(')) {
                diagnostics.push({
                    from: text.indexOf(line),
                    to: text.indexOf(line) + line.length,
                    severity: 'error',
                    message: 'Invalid syntax: Use print() function'
                });
            }

            // Check for invalid for loop syntax
            if (trimmed.startsWith('for') && !trimmed.includes(' in ')) {
                diagnostics.push({
                    from: text.indexOf(line),
                    to: text.indexOf(line) + line.length,
                    severity: 'error',
                    message: 'Invalid for loop syntax: Missing "in" keyword'
                });
            }

            // Check for invalid import syntax
            if (trimmed.includes('import') && trimmed.startsWith('print')) {
                diagnostics.push({
                    from: text.indexOf(line),
                    to: text.indexOf(line) + line.length,
                    severity: 'error',
                    message: 'Invalid import statement'
                });
            }
        });

        // Keep existing indentation checks
        let inBlock = false;
        lines.forEach((line: string) => {
            if (line.trim().endsWith(':')) {
                inBlock = true;
            } else if (inBlock && line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
                diagnostics.push({
                    from: text.indexOf(line),
                    to: text.indexOf(line) + line.length,
                    severity: 'error',
                    message: 'Expected indented block'
                });
            } else if (line.trim()) {
                inBlock = false;
            }
        });

        return diagnostics;
    };

    const javaChecker = (view: any) => {
        const diagnostics: Diagnostic[] = [];
        const text = view.state.doc.toString();
        
        // Check for missing semicolons
        const lines = text.split('\n');
        let position = 0;
        lines.forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
                !trimmed.endsWith(';') && !trimmed.startsWith('//')) {
                diagnostics.push({
                    from: position,
                    to: position + line.length,
                    severity: 'error',
                    message: 'Missing semicolon'
                });
            }
            position += line.length + 1;
        });

        // Check for class definition
        if (text.length > 0 && !text.includes('class')) {
            diagnostics.push({
                from: 0,
                to: text.length,
                severity: 'error',
                message: 'Java code must be inside a class'
            });
        }

        return diagnostics;
    };

    const cppChecker = (view: any) => {
        const diagnostics: Diagnostic[] = [];
        const text = view.state.doc.toString();
        
        // Check for missing semicolons
        const lines = text.split('\n');
        let position = 0;
        lines.forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
                !trimmed.endsWith(';') && !trimmed.startsWith('//') && 
                !trimmed.startsWith('#')) {
                diagnostics.push({
                    from: position,
                    to: position + line.length,
                    severity: 'error',
                    message: 'Missing semicolon'
                });
            }
            position += line.length + 1;
        });

        // Check for main function
        if (text.length > 0 && !text.includes('main')) {
            diagnostics.push({
                from: 0,
                to: text.length,
                severity: 'warning',
                message: 'No main() function found'
            });
        }

        return diagnostics;
    };

    const jsChecker = (view: any) => {
        const diagnostics: Diagnostic[] = [];
        const text = view.state.doc.toString();
        
        try {
            Function(`'use strict'; (async () => { ${text} })()`)
        } catch (e: any) {
            diagnostics.push({
                from: 0,
                to: text.length,
                severity: 'error',
                message: e.message
            });
        }

        // Check for var usage
        if (text.includes('var ')) {
            diagnostics.push({
                from: text.indexOf('var '),
                to: text.indexOf('var ') + 4,
                severity: 'warning',
                message: 'Use let or const instead of var'
            });
        }

        return diagnostics;
    };

    // Add the rubyChecker function definition
    const rubyChecker = (view: any) => {
        const diagnostics: Diagnostic[] = [];
        const text = view.state.doc.toString();
        
        // Check for missing 'end' keyword in Ruby
        const lines = text.split('\n');
        let inBlock = false;
        lines.forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed.endsWith('do') || trimmed.endsWith('if') || trimmed.endsWith('def')) {
                inBlock = true;
            } else if (inBlock && trimmed === 'end') {
                inBlock = false;
            } else if (inBlock && trimmed) {
                diagnostics.push({
                    from: text.indexOf(line),
                    to: text.indexOf(line) + line.length,
                    severity: 'error',
                    message: 'Expected "end" keyword'
                });
            }
        });

        return diagnostics;
    };

    // Function to get the appropriate language extension
    const getLanguageExtensions = () => {
        switch (language) {
            case 'python':
                return [python(), lintGutter(), linter(pythonChecker)];
            case 'java':
                return [java(), lintGutter(), linter(javaChecker)];
            case 'cpp':
            case 'c':
                return [cpp(), lintGutter(), linter(cppChecker)];
            case 'js':
                return [javascript(), lintGutter(), linter(jsChecker)];
            case 'ruby':
                return [];
            case 'rust':
                return [];
            case 'swift':
                return [];
            case 'go':
                return [];
            case 'r':
                return [];
            default:
                return [python(), lintGutter(), linter(pythonChecker)];
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className={styles.codeBackground}>
                <div className="flex-1 flex">
                    {/* Language Icons Sidebar - added pt-4 for top padding */}
                    <div className="w-15 bg-white/80 backdrop-blur-sm shadow-lg flex flex-col space-y-4 pt-4">
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
                        <button 
                            onClick={() => setLanguage('ruby')}
                            className={`p-2 rounded-lg transition-colors ${language === 'ruby' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            title="Ruby"
                        >
                            <Image 
                                src="/icons/ruby.png" 
                                alt="Ruby" 
                                width={32} 
                                height={32} 
                            />
                        </button>
                        <button 
                            onClick={() => setLanguage('rust')}
                            className={`p-2 rounded-lg transition-colors ${language === 'rust' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            title="Rust"
                        >
                            <Image 
                                src="/icons/rust.png" 
                                alt="Rust" 
                                width={32} 
                                height={32} 
                            />
                        </button>
                        <button 
                            onClick={() => setLanguage('swift')}
                            className={`p-2 rounded-lg transition-colors ${language === 'swift' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            title="Swift"
                        >
                            <Image 
                                src="/icons/swift.png" 
                                alt="Swift" 
                                width={32} 
                                height={32} 
                            />
                        </button>
                        <button 
                            onClick={() => setLanguage('go')}
                            className={`p-2 rounded-lg transition-colors ${language === 'go' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            title="Go"
                        >
                            <Image 
                                src="/icons/go.png" 
                                alt="Go" 
                                width={32} 
                                height={32} 
                            />
                        </button>
                        <button 
                            onClick={() => setLanguage('r')}
                            className={`p-2 rounded-lg transition-colors ${language === 'r' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            title="R"
                        >
                            <Image 
                                src="/icons/r.png" 
                                alt="R" 
                                width={32} 
                                height={32} 
                            />
                        </button>
                        <div className="flex-grow"></div>
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 pb-5"
                            title="Settings"
                        >
                            ⚙️
                        </button>
                    </div>

                    {/* Main content - added px-4 for some horizontal padding */}
                    <div className="flex-1 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Left Column - Code Editor */}
                            <div className="h-[calc(100vh-96px)]">
                                <div className="h-10 px-4 bg-gray-100 text-gray-700 font-mono text-sm rounded-t-lg border border-gray-300 border-b-0 flex justify-between items-center">
                                    <span>
                                        {language === 'python' && 'main.py'}
                                        {language === 'java' && 'Main.java'}
                                        {language === 'cpp' && 'main.cpp'}
                                        {language === 'c' && 'main.c'}
                                        {language === 'js' && 'script.js'}
                                        {language === 'ruby' && 'script.rb'}
                                        {language === 'rust' && 'main.rs'}  
                                        {language === 'swift' && 'main.swift'}  
                                        {language === 'go' && 'main.go'}
                                        {language === 'r' && 'script.R'}
                                    </span>
                                    <div className="flex gap-2 relative">
                                        <div className="relative inline-flex items-center group">
                                            <span 
                                                className="cursor-pointer bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                                            >
                                                ?
                                            </span>
                                            <div className="absolute hidden group-hover:block bg-gray-700 text-white w-[1000%] text-xs rounded p-2 top-full left-1/2 transform -translate-x-1/2 mt-1 z-50">
                                                Note: you cannot run code that requires a graphical interface or user input.
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRunCode}
                                            className="px-3 py-1 text-sm rounded transition-colors bg-green-500 text-white hover:bg-green-600"
                                        >
                                            Run
                                        </button>
                                        <button
                                            onClick={() => setActiveTab(activeTab === 2 ? 1 : 2)}
                                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                                activeTab === 2 
                                                    ? 'bg-gray-300 text-gray-700' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                                    </div>
                                </div>
                                <div className="relative h-[calc(100%-2.5rem)]">
                                    <div className="h-full rounded-b-lg overflow-hidden border border-gray-300">
                                        <CodeMirror
                                            value={code}
                                            height="100%"
                                            theme="light"
                                            extensions={getLanguageExtensions()}
                                            onChange={(value) => setCode(value)}
                                            className="h-full" 
                                            basicSetup={{
                                                lineNumbers: true,
                                                highlightActiveLineGutter: true,
                                                highlightSpecialChars: true,
                                                foldGutter: true,
                                                drawSelection: true,
                                                dropCursor: true,
                                                indentOnInput: true,
                                                syntaxHighlighting: true,
                                                bracketMatching: true,
                                                closeBrackets: true,
                                                autocompletion: true,
                                                highlightActiveLine: true,
                                                highlightSelectionMatches: true,
                                            }}
                                        />
                                        {activeTab === 2 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-white border border-gray-300 p-4 rounded-b-lg">
                                                <input
                                                    type="text"
                                                    value={stdin}
                                                    onChange={handleStdinChange}
                                                    placeholder="Enter input values..."
                                                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Output */}
                            <div className="h-[calc(100vh-96px)]">
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
                                </div>
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

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Settings</h3>
                        <div className="space-y-4">
                            <label className="block">
                                Timeout (seconds):
                                <input
                                    type="number"
                                    value={timeoutDuration || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setTimeoutDuration(value ? Number(value) : null);
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </label>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 