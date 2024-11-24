import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, withOptionalAuth } from '../../../utils/middleware';

const prisma = new PrismaClient();

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  if (req.method === 'GET') {
    try {
      if (!userId) {
        return res.status(400).json({ error: 'User is not authenticated' });
      }

      const savedCodeTemplates = await prisma.codeTemplate.findMany({
        where: {
          savedByUsers: {
            some: {
              id: userId  // User has saved these blog posts
            }
          },
        },
      })

      return res.status(200).json(savedCodeTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { templateId } = req.body;

      if (!templateId) {
        return res.status(400).json({ error: 'Template ID is required' });
      }

      await prisma.codeTemplate.update({
        where: { id: templateId },
        data: {
          savedByUsers: {
            disconnect: { id: userId },
          },
        },
      });

      return res.status(200).json({ message: 'User removed from saved templates successfully' });
    } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});