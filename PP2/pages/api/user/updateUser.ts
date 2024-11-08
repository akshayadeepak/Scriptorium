import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../utils/middleware';

const prisma = new PrismaClient();

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, phoneNumber, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
        ...(avatar && { avatar })
      }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user information' });
  }
}); 