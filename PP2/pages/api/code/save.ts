import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '../../../utils/middleware';

const prisma = new PrismaClient();

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { templateId } = req.body;

  if (!templateId) {
    return res.status(400).json({ error: 'Template ID is required' });
  }

  try {
    const originalTemplate = await prisma.codeTemplate.findUnique({
      where: { id: templateId },
      include: { tags: true }
    });

    if (!originalTemplate) {
      return res.status(404).json({ error: 'Original template not found' });
    }

    const savedTemplate = await prisma.codeTemplate.update({
      where: { id: templateId },
      data: {
        savedByUsers : {
          connect: { id: userId }
        }
      }
    });
    return res.status(201).json(savedTemplate);
  } catch (error) {
    console.error('Error saving template:', error);
    return res.status(500).json({ error: 'Failed to save template' });
  }
}); 