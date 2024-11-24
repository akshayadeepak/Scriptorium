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

function clearTempDirectory() {
    fs.readdirSync(tempDir).forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.unlinkSync(filePath);
    });
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

    let file: string;
    let dockerfile: string;
    let command: string;
    let compileCommand: string | undefined = undefined; // Initialize compileCommand to undefined
    let className: string;

    // Create unique filename for concurrent requests
    const timestamp = Date.now();

    switch (language) {
        case 'python':
            file = path.join(tempDir, `main.py`);
            dockerfile = 'dockerfiles/python.dockerfile';
            command = `python3 /app/main.py`;
            break;
        case 'js':
            file = path.join(tempDir, `script.js`);
            dockerfile = 'dockerfiles/node.dockerfile';
            command = `node /app/script.js`;
            break;
        case 'java':
            // Set the filename and class name dynamically
            className = `Main`;  // Dynamically generate class name based on timestamp
            file = path.join(tempDir, `${className}.java`); // Save the file as Main_<timestamp>.java
            dockerfile = 'dockerfiles/java.dockerfile';

            // Set the compile and run commands for Java
            compileCommand = `javac /app/${className}.java`;  // Compile the dynamically generated Java code
            command = `java -cp /app ${className}`;  // Run the compiled Java class, className without path
            break;
        case 'c':
            file = path.join(tempDir, `main.c`);
            dockerfile = 'dockerfiles/c.dockerfile';
            command = `./main`;
            break;
        case 'cpp':
            file = path.join(tempDir, `main.cpp`);
            dockerfile = 'dockerfiles/cpp.dockerfile';
            command = `./main`;
            break;
        default:
            return res.status(400).json({ error: 'Language not supported' });
    }

    if (stdin) {
        const argsList = stdin.trim().split(/\s+/).filter((arg: string) => arg.length > 0);
        command = argsList.length > 0 
            ? `${command} ${argsList.map((arg: string) => `"${arg}"`).join(' ')}`
            : command;
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

        // Build and run the Docker container
        const dockerBuildCommand = `docker build -f ${dockerfile} -t my-${language}-app .`;
        const dockerRunCommand = `docker run --rm -v ${tempDir}:/app my-${language}-app ${command} ${stdin.trim()} 2>&1`;

        if (language === 'java') {
            // Only for Java: First compile the Java program with javac, then run it
            try {
                await execPromise(dockerBuildCommand);
                // Ensure the compileCommand is defined only for Java
                if (compileCommand) {
                    await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app ${compileCommand} 2>&1`);  // Compile the Java code
                }
                // Run the compiled Java code using the correct class name
                const output = await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app java -cp /app ${className} 2>&1`);
                cleanupFiles(file);
                clearTempDirectory();
                return res.status(200).json({ output });
            } catch (error: any) {
                const errorMessage = error.output || error.message || 'An error occurred while executing the code';
                cleanupFiles(file);
                clearTempDirectory();
                return res.status(400).json({ error: errorMessage });
            }
        } else {
            // For non-Java languages, just build and run
            try {
                await execPromise(dockerBuildCommand);
                const output = await execPromise(dockerRunCommand);
                cleanupFiles(file);
                clearTempDirectory();
                return res.status(200).json({ output });
            } catch (error: any) {
                const errorMessage = error.output || error.message || 'An error occurred while executing the code';
                cleanupFiles(file);
                clearTempDirectory();
                return res.status(400).json({ error: errorMessage });
            }
        }
    } catch (error: any) {
        cleanupFiles(file);
        clearTempDirectory();
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
};
