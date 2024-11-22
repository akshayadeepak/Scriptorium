import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from './token';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedHandler {
  (req: NextApiRequest, res: NextApiResponse, userId: any): Promise<void | NextApiResponse>;
}

// Helper function to get user details if needed
async function getUserDetails(userId: number) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      phoneNumber: true,
      avatar: true,
      permission: true,
      createdAt: true,
    }
  });
}

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return handler(req, res, payload.userId);
  };
}

export function withAdminAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin permission
    const user = await getUserDetails(payload.userId);
    if (!user || user.permission !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    return handler(req, res, payload.userId);
  };
}

export function withOptionalAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    return handler(req, res, userId);
  };
}

// Export getUserDetails if needed elsewhere
export { getUserDetails };