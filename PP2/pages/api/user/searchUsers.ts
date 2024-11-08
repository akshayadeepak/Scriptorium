import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../utils/middleware';

const prisma = new PrismaClient();

interface SearchQuery {
  username?: string;
  email?: string;
  page?: string;
  pageSize?: string;
}

export default async function searchUsers(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  authenticateToken(req, res, async () => {
    const { userId, permission } = req.user;

    if (permission !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can search users' });
    }

    const { username, email, page = "1", pageSize = "10" } = req.query as SearchQuery;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            username ? { username: { contains: username } } : {},
            email ? { email: { contains: email } } : {},
          ],
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
        skip: skip,
        take: parseInt(pageSize),
      });

      const totalUsers = await prisma.user.count({
        where: {
          AND: [
            username ? { username: { contains: username } } : {},
            email ? { email: { contains: email } } : {},
          ],
        },
      });

      res.status(200).json({
        users,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalUsers,
          totalPages: Math.ceil(totalUsers / parseInt(pageSize)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to search users' });
    }
  });
}
