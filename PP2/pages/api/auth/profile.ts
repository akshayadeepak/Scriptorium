import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '../../../utils/middleware';

const prisma = new PrismaClient();

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        avatar: true
      }
    });

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(userProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ message: "Error fetching profile" });
  }
});
