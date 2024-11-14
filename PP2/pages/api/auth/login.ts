import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../utils/token';

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        console.error('Email or password not provided:', { email, password });
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken({ 
            userId: user.id,
            permission: user.permission 
        });

        res.json({ 
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error('Login error:', error);
        res.status(500).json({ 
            message: "Login failed", 
            error: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred' 
        });
    }
}
