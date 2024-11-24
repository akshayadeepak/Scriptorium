import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create temp directory in the project root
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

function cleanupFiles(file: string) {
    try {
        fs.unlinkSync(file);
        // Cleanup compiled files for C/C++
        const compiledFile = file.replace(/\.(c|cpp)$/, '');
        if (fs.existsSync(compiledFile)) {
            fs.unlinkSync(compiledFile);
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
}

interface ExecExceptionWithOutput extends Error {
    output?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, language, stdin = '' } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Missing code" });
    }

    let command: string;
    let file: string;
    let comp_command: string = '';
    
    // Create unique filename for concurrent requests
    const timestamp = Date.now();
    
    switch (language) {
        case 'python':
            file = path.join(tempDir, `main_${timestamp}.py`);
            command = `python3 ${file}`;
            break;
        case 'js':
            file = path.join(tempDir, `script_${timestamp}.js`);
            command = `node ${file}`;
            break;
        case 'java':
            file = path.join(tempDir, `Main_${timestamp}.java`);
            command = `java ${file}`;
            break;
        case 'c':
            file = path.join(tempDir, `main_${timestamp}.c`);
            comp_command = `gcc ${file} -o ${path.join(tempDir, `main_${timestamp}`)}`;
            command = path.join(tempDir, `main_${timestamp}`);
            break;
        case 'cpp':
            file = path.join(tempDir, `main_${timestamp}.cpp`);
            comp_command = `g++ ${file} -o ${path.join(tempDir, `main_${timestamp}`)}`;
            command = path.join(tempDir, `main_${timestamp}`);
            break;
        default:
            return res.status(400).json({ error: 'Language not supported' });
    }

    if (stdin) {
        console.log("stdin");
        const argsList = stdin.trim().split(/\s+/).filter((arg: string) => arg.length > 0);
        const finalCommand = argsList.length > 0 
            ? `${command} ${argsList.map((arg: string) => `"${arg}"`).join(' ')}`
            : command;
        command = finalCommand;
    } 

    try {
        fs.writeFileSync(file, code);

        const execPromise = (cmd: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        const execError: ExecExceptionWithOutput = error as ExecExceptionWithOutput;
                        execError.output = stdout || stderr;
                        reject(execError);
                    } else {
                        resolve(stdout || stderr);
                    }
                });
            });
        };

        if (language === "c" || language === "cpp") {
            try {
                await execPromise(comp_command);
                const output = await execPromise(command);
                cleanupFiles(file);
                return res.status(200).json({ output });
            } catch (error: any) {
                cleanupFiles(file);
                return res.status(400).json({ 
                    error: error.output || error.message || 'Compilation/Runtime error'
                });
            }
        } else if (language === 'python') {
            // Create a unique filename for the temporary Python file
            const timestamp = Date.now();
            const tempFilePath = path.join(tempDir, `main_${timestamp}.py`);

            // Write the code to the temporary file
            fs.writeFileSync(tempFilePath, code);

            // Use the stdin input as command-line arguments
            const args = stdin.trim(); // Get the stdin input directly
            const dockerCommand = `docker build -f dockerfiles/python.dockerfile -t my-python-app . && docker run --rm -v ${tempDir}:/app my-python-app python3 /app/main_${timestamp}.py ${args} 2>&1`; // Capture both stdout and stderr

            try {
                // Execute the Docker command and capture both stdout and stderr
                const output = await execPromise(dockerCommand);
                console.log('Docker Output:', output); // Log the output
                cleanupFiles(tempFilePath); // Clean up the temp file
                return res.status(200).json({ output });
            } catch (error: any) {
                // Capture the error output from the Docker command
                const errorMessage = error.output || error.message || 'An error occurred while executing the code';
                console.error('Docker Error:', errorMessage); // Log the error
                cleanupFiles(tempFilePath);
                return res.status(400).json({ error: errorMessage });
            }
        } else {
            try {
                const output = await execPromise(command);
                cleanupFiles(file);
                return res.status(200).json({ output });
            } catch (error: any) {
                cleanupFiles(file);
                return res.status(400).json({ error: error.message });
            }
        }
    } catch (error: any) {
        cleanupFiles(file);
        return res.status(500).json({ 
            error: process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'An error occurred while executing the code' 
        });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
} 