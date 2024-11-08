import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../utils/middleware';

const prisma = new PrismaClient();

// Add type for valid actions
type BlogAction = 'hide' | 'unhide' | 'rate' | undefined;

async function putHandler(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const { id } = req.query;
  const { title, content, tags, links, action, rating, hiddenFlag } = req.body;
  
  try {
    const blogId = Number(id);
    
    // Validate blog exists
    const existingBlog = await prisma.blogPost.findUnique({
      where: { id: blogId },
      include: { tags: true }
    });

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Calculate new rating only if action is 'rate' and rating is provided
    let newRating = existingBlog.ratings;
    if (action === 'rate' && typeof rating === 'number') {
      newRating = rating;
    }

    // Determine hidden flag based on action or provided hiddenFlag
    let newHiddenFlag = existingBlog.hiddenFlag;
    if (action === 'hide') {
      newHiddenFlag = true;
    } else if (action === 'unhide') {
      newHiddenFlag = false;
    } else if (typeof hiddenFlag === 'boolean') {
      newHiddenFlag = hiddenFlag;
    }

    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        title: title ?? existingBlog.title,
        content: content ?? existingBlog.content,
        ratings: newRating,
        hiddenFlag: newHiddenFlag,
        ...(tags && {
          tags: {
            // First disconnect all existing tags
            disconnect: existingBlog.tags.map(tag => ({ id: tag.id })),
            // Then connect or create new tags
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag }
            }))
          }
        }),
        ...(links && {
          links: {
            connect: links.map((linkId: number) => ({ id: linkId }))
          }
        })
      },
      include: {
        author: {
          select: {
            username: true
          }
        },
        tags: true,
        links: true
      }
    });

    return res.status(200).json(updatedBlog);
  } catch (error) {
    console.error('Blog update error:', error);
    return res.status(500).json({ error: "Failed to update blog post" });
  }
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  if (req.method === "PUT") {
    return putHandler(req, res, userId);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    // Check if id is provided and is a valid number
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid or missing blog post ID" });
    }

    try {
      const blogPostId = Number(id);

      // Check if the blog post exists
      const existingPost = await prisma.blogPost.findUnique({
        where: { id: blogPostId }
      });

      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Optionally, manually delete related records if not using cascading deletes
      await prisma.comment.deleteMany({
        where: { blogPostId }
      });

      await prisma.blogPost.delete({
        where: { id: blogPostId }
      });

      return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Post not found or already deleted' });
      }
      console.error('Delete post error:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  const adminHandler = async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
    const { id } = req.query;
    const { hiddenFlag, resolveReports } = req.body;

    try {
      const updatedPost = await prisma.blogPost.update({
        where: { id: Number(id) },
        data: {
          hiddenFlag: hiddenFlag ?? undefined,
        },
        include: {
          author: {
            select: { username: true }
          },
          reports: true
        }
      });

      return res.status(200).json(updatedPost);
    } catch (error) {
      console.error('Admin update error:', error);
      return res.status(500).json({ error: "Failed to update post" });
    }
  };

  return res.status(405).json({ error: "Method not allowed" });
});