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

const execWithTimeout = (cmd: string, timeoutDuration: number): Promise<string> => {
    return Promise.race([
        execPromise(cmd),
        new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Execution timed out')), timeoutDuration)
        )
    ]);
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, language, stdin = '', timeout = 30000 } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Code input is required for execution." });
    }

    let file: string;
    let dockerfile: string;
    let command: string;
    let compileCommand: string | undefined = undefined; // Initialize compileCommand to undefined
    let className = '';

    switch (language) {
        case 'python':
            file = path.join(tempDir, `main.py`);
            dockerfile = 'dockerfiles/python.dockerfile';
            command = `python3 /app/main.py`;
            break;
        case 'js':
            file = path.join(tempDir, `script.js`);
            dockerfile = 'dockerfiles/js.dockerfile';
            command = `node /app/script.js`;
            break;
        case 'java':
            className = `Main`; 
            file = path.join(tempDir, `${className}.java`);
            dockerfile = 'dockerfiles/java.dockerfile';

            compileCommand = `javac /app/${className}.java`;
            command = `java -cp /app ${className}`;
            break;
        case 'c':
            file = path.join(tempDir, `main.c`);
            dockerfile = 'dockerfiles/c.dockerfile';
            command = `./main`;
            compileCommand = `gcc /app/main.c -o /app/main`;
            break;
        case 'cpp':
            file = path.join(tempDir, `main.cpp`);
            dockerfile = 'dockerfiles/cpp.dockerfile';
            command = `./main`;
            compileCommand = `g++ /app/main.cpp -o /app/main`;
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

        // Build and run the Docker container
        const dockerBuildCommand = `docker build -f ${dockerfile} -t my-${language}-app .`;
        const dockerRunCommand = `docker run --rm -v ${tempDir}:/app --memory="256m" --cpus="1.0" my-${language}-app ${command} ${stdin.trim()} 2>&1`;

        // Java: Handle compilation and execution in separate steps
        if (language === 'java') {
            try {
                await execWithTimeout(dockerBuildCommand, timeout); // Build the Docker image
                
                if (compileCommand) {
                    // Compile the Java code (if compilation is needed)
                    await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app ${compileCommand} 2>&1`);
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
        } else if (language === 'c' || language === 'cpp') {
            // For C and C++: Compile the code first, then run the compiled executable
            try {
                await execWithTimeout(dockerBuildCommand, timeout); // Build the Docker image
        
                // Compile the code using the correct command
                await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app ${compileCommand} 2>&1`);
        
                // Run the compiled executable
                const output = await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app /app/main 2>&1`);
        
                cleanupFiles(file);
                clearTempDirectory();
                return res.status(200).json({ output });
            } catch (error: any) {
                const errorMessage = error.output || error.message || 'An error occurred while compiling/running the C/C++ code';
                cleanupFiles(file);
                clearTempDirectory();
                return res.status(400).json({ error: errorMessage });
            }
        } else {
            // Handle other languages (e.g., Python, JS)
            try {
                await execWithTimeout(dockerBuildCommand, timeout);
                const output = await execWithTimeout(dockerRunCommand, timeout);
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