import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, withOptionalAuth } from '../../../utils/middleware';

const prisma = new PrismaClient();

const getHandler = withOptionalAuth( async(req: NextApiRequest, res: NextApiResponse, userId: number | null) => {
  try {
    const { search, page } = req.query;
    const searchQuery = search ? String(search).toLowerCase() : '';
      console.log('Search query:', searchQuery);
    const pageQuery = page;
      console.log('Page query:', pageQuery);

      if (!page) {
        const templates = await prisma.codeTemplate.findMany({
          where: {
            ...(userId ? { authorId: Number(userId) } : {}),
            OR: [
              { title: { contains: searchQuery } },
              { explanation: { contains: searchQuery } },
              { tags: { some: { name: { contains: searchQuery } } } }
            ]
          },
          include: {
            tags: true,
            author: true,
            parentTemplate: true,
            childTemplates: true,
            savedByUsers: true,
            blogPost: true,
          },
        });
  
      return res.status(200).json(templates);
      }
      const offset = (Number(page) - 1) * 10;
      const templates = await prisma.codeTemplate.findMany({
        where: {
          ...(userId ? { authorId: Number(userId) } : {}),
          OR: [
            { title: { contains: searchQuery } },
            { explanation: { contains: searchQuery } },
            { tags: { some: { name: { contains: searchQuery } } } }
          ]
        },
        include: {
          tags: true,
          author: true,
          parentTemplate: true,
          childTemplates: true,
          savedByUsers: true,
          blogPost: true,
        },
        skip: offset,
        take: 10,
      });

    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

const postHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
    try {
      const { title, explanation, tags, language, content, fork } = req.body;

      if (!title || !explanation || !language || !content) {
        return res.status(400).json({ error: 'Title, explanation, language, and content are required' });
      }

      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!userExists) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Creating template with userId:', userId);
      console.log('Tags:', tags);

      const newTemplate = await prisma.codeTemplate.create({
        data: {
          title,
          explanation,
          authorId: userId,
          language,
          content,
          fork,
          tags: {
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag }
            }))
          }
        }
      });

      return res.status(201).json(newTemplate);
    } catch (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({ error: 'Failed to create template' });
    }
  });

const putHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  try {
    const { id, title, explanation, tags, language, content } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const existingTemplate = await prisma.codeTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (existingTemplate.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this template' });
    }

    const updatedTemplate = await prisma.codeTemplate.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(explanation && { explanation }),
        ...(language && { language }),
        ...(content && { content }),
        ...(tags && {
          tags: {
            set: [],
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag }
            }))
          }
        })
      },
      include: {
        tags: true, 
      }
    });

    return res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({ error: 'Failed to update template' });
  }
});

const deleteHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
    const { id } = req.query;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid or missing template ID" });
    }

    try {
      const templateId = Number(id);

      const existingTemplate = await prisma.codeTemplate.findUnique({
        where: { id: templateId }
      });

      if (!existingTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      if (existingTemplate.authorId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this template' });
      }

      await prisma.codeTemplate.delete({
        where: { id: templateId }
      });

      return res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Template not found or already deleted' });
      }
      console.error('Error deleting template:', error);
      return res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
      return getHandler(req, res);
    }
    
    if (req.method === "POST") {
      return postHandler(req, res);
    }
  
    if (req.method === "PUT") {
      return putHandler(req, res);
    }

    if (req.method === "DELETE") {
      return deleteHandler(req, res);
    }
  }
