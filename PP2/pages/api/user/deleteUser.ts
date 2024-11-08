import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../utils/middleware';

const prisma = new PrismaClient();

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related records first
    await prisma.comment.deleteMany({
      where: { authorId: userId }
    });

    await prisma.blogPost.deleteMany({
      where: { authorId: userId }
    });

    await prisma.codeTemplate.deleteMany({
      where: { authorId: userId }
    });

    // Now delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User or related records not found' });
    }
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}); 