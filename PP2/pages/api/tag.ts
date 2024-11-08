import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../utils/middleware';

const prisma = new PrismaClient();

// Unprotected GET handler
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            blogPosts: true
          }
        }
      }
    });

    return res.status(200).json(tags);
  } catch (error) {
    console.error('Tags fetch error:', error);
    return res.status(500).json({ error: "Failed to fetch tags" });
  }
}

// Protected POST handler
const postHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: "Tag name is required and must be a string" });
  }

  try {
    // Check if user has admin permission
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { permission: true }
    });

    if (!user || user.permission !== 'ADMIN') {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name: name.toLowerCase().trim() }
    });

    if (existingTag) {
      return res.status(400).json({ error: "Tag already exists" });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.toLowerCase().trim()
      }
    });

    return res.status(201).json(tag);
  } catch (error) {
    console.error('Tag creation error:', error);
    return res.status(500).json({ error: "Failed to create tag" });
  }
});

// Protected DELETE handler
const deleteHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  const { id, name } = req.query;

  if (!id && !name) {
    return res.status(400).json({ error: "Tag ID or name is required" });
  }

  try {
    // Check if user has admin permission
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { permission: true }
    });

    if (!user || user.permission !== 'ADMIN') {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Delete the tag by ID or name
    const tag = await prisma.tag.delete({
      where: id ? { id: Number(id) } : { name: String(name).toLowerCase().trim() }
    });

    return res.status(200).json({ message: "Tag deleted successfully", tag });
  } catch (error) {
    console.error('Tag deletion error:', error);
    return res.status(500).json({ error: "Failed to delete tag" });
  }
});

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getHandler(req, res);
  }
  
  if (req.method === 'POST') {
    return postHandler(req, res);
  }

  if (req.method === 'DELETE') {
    return deleteHandler(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
} 