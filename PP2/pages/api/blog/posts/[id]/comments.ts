import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '../../../../../utils/middleware';

const prisma = new PrismaClient();

// For unprotected GET requests
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { id } = req.query;

    // Check if id is provided and is a valid number
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid or missing blog post ID" });
    }

    try {
      const blogPostId = Number(id);

      const comments = await prisma.comment.findMany({
        where: {
          blogPostId: blogPostId,
          hiddenFlag: false
        },
        include: {
          author: {
            select: {
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(comments);
    } catch (error) {
      console.error('Comments fetch error:', error);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }
  }

  // For protected routes, use withAuth
  return protectedHandler(req, res);
}

// Handler for authenticated routes
const protectedHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number): Promise<void | NextApiResponse> => {
    const { id, commentId } = req.query;
  
    // Check if id is provided and is a valid number
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid or missing blog post ID" });
    }
  
    switch (req.method) {
    case 'POST': {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      try {
        const blogPostId = Number(id);

        // Check if the blog post exists
        const blogPost = await prisma.blogPost.findUnique({
          where: { id: blogPostId }
        });

        if (!blogPost) {
          return res.status(404).json({ error: "Blog post not found" });
        }

        const comment = await prisma.comment.create({
          data: {
            content: content.trim(),
            authorId: userId,
            blogPostId: blogPostId
          },
          include: {
            author: {
              select: {
                username: true
              }
            }
          }
        });

        return res.status(201).json(comment);
      } catch (error) {
        console.error('Comment creation error:', error);
        return res.status(500).json({ error: "Failed to create comment" });
      }
    }

    case 'PUT': {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required" });
      }

      try {
        const existingComment = await prisma.comment.findUnique({
          where: { id: Number(commentId) },
          include: { author: true }
        });

        if (!existingComment) {
          return res.status(404).json({ error: "Comment not found" });
        }

        if (existingComment.author.id !== userId) {
          return res.status(403).json({ error: "You can only edit your own comments" });
        }

        const updatedComment = await prisma.comment.update({
          where: { id: Number(commentId) },
          data: { content },
          include: {
            author: {
              select: {
                username: true
              }
            }
          }
        });

        return res.status(200).json(updatedComment);
      } catch (error) {
        console.error('Comment update error:', error);
        return res.status(500).json({ error: "Failed to update comment" });
      }
    }

    case 'DELETE': {
      if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required" });
      }

      try {
        const existingComment = await prisma.comment.findUnique({
          where: { id: Number(commentId) },
          include: {
            author: true,
            blogPost: {
              select: {
                authorId: true
              }
            }
          }
        });

        if (!existingComment) {
          return res.status(404).json({ error: "Comment not found" });
        }

        // Check if user is the comment author, blog post author, or an admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { permission: true }
        });

        const canDelete = 
          existingComment.author.id === userId || 
          existingComment.blogPost.authorId === userId ||
          user?.permission === 'ADMIN';

        if (!canDelete) {
          return res.status(403).json({ error: "You don't have permission to delete this comment" });
        }

        await prisma.comment.delete({
          where: { id: Number(commentId) }
        });

        return res.status(204).end();
      } catch (error) {
        console.error('Comment deletion error:', error);
        return res.status(500).json({ error: "Failed to delete comment" });
      }
    }

    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
});