import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prismaClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Invalid search query' });
  }

  try {
    // Convert the query to lowercase for case-insensitive searching
    const searchTerm = query.toLowerCase();

    // Fetch results across all categories: Users, Blog Posts, Code Templates
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchTerm } },
          { firstName: { contains: searchTerm } },
          { lastName: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    const blogs = await prisma.blogPost.findMany({
      where: {
        title: {
          contains: searchTerm,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });

    const codeTemplates = await prisma.codeTemplate.findMany({
      where: {
        title: {
          contains: searchTerm,
        },
      },
      select: {
        id: true,
        title: true,
        explanation: true,
      },
    });

    res.status(200).json({ users, blogs, codeTemplates });
  } catch (error) {
    console.error('Error in search API:', error);
    res.status(500).json({ error: 'An error occurred while fetching search results' });
  }
}