import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../utils/middleware';

const prisma = new PrismaClient();

interface MakeAdminRequest {
  targetUserId: number;
}

export default async function makeAdmin(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  authenticateToken(req, res, async () => {
    const { userId, permission } = req.user;

    if (permission !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can make other users admins' });
    }

    const { targetUserId } = req.body as MakeAdminRequest;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    try {
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: { permission: 'ADMIN' },
      });

      res.status(200).json({ message: `${user.username} is now an admin`, user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to make user an admin' });
    }
  });
}
