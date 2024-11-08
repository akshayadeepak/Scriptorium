import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../utils/token';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, password, email, phoneNumber } = req.body;
    
    try {
        // Validate input
        if (!email || !password || !username) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
        }

        // Check for existing user - separate queries to handle each case
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingEmail) {
            return res.status(400).json({
                message: "This email is already registered"
            });
        }

        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUsername) {
            return res.status(400).json({
                message: "This username is already taken"
            });
        }

        if (phoneNumber) {
            const existingPhone = await prisma.user.findFirst({
                where: { phoneNumber }
            });

            if (existingPhone) {
                return res.status(400).json({
                    message: "This phone number is already registered"
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with admin permission
        const user = await prisma.user.create({
            data: { 
                username, 
                password: hashedPassword, 
                email, 
                phoneNumber: phoneNumber || null,
                permission: 'ADMIN' // Set permission to ADMIN
            }
        });

        // Generate JWT
        const token = generateToken({ userId: user.id, permission: 'ADMIN' });

        // Return success response
        return res.status(201).json({ 
            message: "User created successfully",
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error: any) {
        console.error('Signup error:', error);
        
        // Handle Prisma unique constraint violations
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            const fieldMessages: { [key: string]: string } = {
                phoneNumber: "This phone number is already registered",
                email: "This email is already registered",
                username: "This username is already taken"
            };
            
            if (field && fieldMessages[field]) {
                return res.status(400).json({ 
                    message: fieldMessages[field]
                });
            }
        }
        
        // Generic error response
        return res.status(500).json({ 
            message: "Registration failed. Please try again.",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}