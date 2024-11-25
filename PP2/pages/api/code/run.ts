import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
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
    console.log("Received request:", req.method, req.body);

    if (req.method !== 'POST') {
        console.log("Method not allowed:", req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, language, stdin = '', timeout = 30000 } = req.body;

    if (!code) {
        console.log("Code input is required.");
        return res.status(400).json({ error: "Code input is required for execution." });
    }

    console.log("Executing code for language:", language);

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
        case 'ruby':
            file = path.join(tempDir, `main.rb`);
            dockerfile = 'dockerfiles/ruby.dockerfile';
            command = `ruby /app/main.rb`;
            break;
        case 'rust':
            file = path.join(tempDir, `main.rs`);
            dockerfile = 'dockerfiles/rust.dockerfile';
            command = `cargo run`;
            break;
        case 'swift':
            file = path.join(tempDir, `main.swift`);
            dockerfile = 'dockerfiles/swift.dockerfile';
            command = `swift /app/main.swift`;
            break;
        case 'csharp':
            file = path.join(tempDir, `main.cs`);
            dockerfile = 'dockerfiles/csharp.dockerfile';
            command = `dotnet run`;
            break;
        default:
            console.log("Language not supported:", language);
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
        console.log("Code written to file:", file);

        // Build and run the Docker container
        const dockerBuildCommand = `docker build -f ${dockerfile} -t my-${language}-app .`;
        console.log("Docker build command:", dockerBuildCommand);

        const dockerRunCommand = `docker run --rm -v ${tempDir}:/app --memory="256m" --cpus="1.0" my-${language}-app ${command} ${stdin.trim()} 2>&1`;
        console.log("Docker run command:", dockerRunCommand);

        // Java: Handle compilation and execution in separate steps
        if (language === 'java') {
            try {
                await execWithTimeout(dockerBuildCommand, timeout); // Build the Docker image
                console.log("Docker image built successfully.");

                if (compileCommand) {
                    // Compile the Java code (if compilation is needed)
                    await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app ${compileCommand} 2>&1`);
                    console.log("Java code compiled successfully.");
                }
                
                // Run the compiled Java code using the correct class name
                const output = await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app java -cp /app ${className} 2>&1`);
                clearTempDirectory();
                console.log("Java code executed successfully. Output:", output);
                return res.status(200).json({ output });
            } catch (error: any) {
                const errorMessage = error.output || error.message || 'An error occurred while executing the code';
                console.error("Error during Java execution:", errorMessage);
                clearTempDirectory();
                return res.status(400).json({ error: errorMessage });
            }
        } else if (language === 'c' || language === 'cpp') {
            // For C and C++: Compile the code first, then run the compiled executable
            try {
                await execWithTimeout(dockerBuildCommand, timeout); // Build the Docker image
                console.log("Docker image built successfully for C/C++.");

                // Compile the code using the correct command
                await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app ${compileCommand} 2>&1`);
                console.log("C/C++ code compiled successfully.");

                // Run the compiled executable
                const output = await execPromise(`docker run --rm -v ${tempDir}:/app my-${language}-app /app/main 2>&1`);
                clearTempDirectory();
                console.log("C/C++ code executed successfully. Output:", output);
                return res.status(200).json({ output });
            } catch (error: any) {
                const errorMessage = error.output || error.message || 'An error occurred while compiling/running the C/C++ code';
                console.error("Error during C/C++ execution:", errorMessage);
                clearTempDirectory();
                return res.status(400).json({ error: errorMessage });
            }
        } else {
            // Handle other languages (e.g., Python, JS)
            try {
                await execWithTimeout(dockerBuildCommand, timeout);
                console.log("Docker image built successfully for other languages.");
                const output = await execWithTimeout(dockerRunCommand, timeout);
                clearTempDirectory();
                console.log("Code executed successfully. Output:", output);
                return res.status(200).json({ output });
            } catch (error: any) {
                const errorMessage = error.output || error.message || 'An error occurred while executing the code';
                console.error("Error during execution:", errorMessage);
                clearTempDirectory();
                return res.status(400).json({ error: errorMessage });
            }
        }
        
    } catch (error: any) {
        console.error("Error writing code to file or executing:", error);
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