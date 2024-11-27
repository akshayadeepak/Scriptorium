import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withAdminAuth, withOptionalAuth } from '../../../utils/middleware';

const prisma = new PrismaClient();

const getHandler = withOptionalAuth( async(req: NextApiRequest, res: NextApiResponse, userId: number | null) => {
  try {
    const { tagName, authorId, templateId, sortBy } = req.query;

    // Check if templateId is provided and is a valid number
    if (templateId && isNaN(Number(templateId))) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const visiblePosts = await prisma.blogPost.findMany({
      where: {
        hiddenFlag: false,
        ...(tagName && {
          tags: {
            some: {
              name: tagName as string
            }
          }
        }),
        ...(authorId && {
          authorId: Number(authorId)
        }),
        ...(templateId && {
          links: {
            some: {
              id: Number(templateId)
            }
          }
        })
      },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        comments: {
          where: {
            hiddenFlag: false
          },
          include: {
            author: {
              select: {
                username: true
              }
            },
            childrenComments: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true
                  }
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tags: true,
        links: true,
        reports: true,
      },
      orderBy: sortBy === 'reports'
        ? { reports: { _count: 'desc' } }
        : { ratings: 'desc' }
    });

    let posts = [...visiblePosts]
    if (userId) {
      const authorPosts = await prisma.blogPost.findMany({
        where: {
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true
            }
          },
          comments: {
            where: {
              hiddenFlag: false,
            },
            include: {
              author: {
                select: {
                  username: true
                }
              },
              childrenComments: {
                include: {
                  author: {
                    select: {
                      username: true
                    }
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          tags: true,
          links: true,
          reports: true
        },
        orderBy: sortBy === 'reports'
          ? { reports: { _count: 'desc' } }
          : { ratings: 'desc' }
      });

      const authorComments = await prisma.blogPost.findMany({
        where: {
          hiddenFlag: false,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true
            }
          },
          comments: {
            where: {
              authorId: userId
            },
            include: {
              author: {
                select: {
                  username: true
                }
              },
              childrenComments: {
                include: {
                  author: {
                    select: {
                      username: true
                    }
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          tags: true,
          links: true,
          reports: true
        },
        orderBy: sortBy === 'reports'
          ? { reports: { _count: 'desc' } }
          : { ratings: 'desc' }
      });

      const postMap = new Map();

      [...visiblePosts, ...authorPosts].forEach(post => {
        postMap.set(post.id, post);
      });

      authorComments.forEach(post => {
        postMap.set(post.id, post);
      });

      posts = Array.from(postMap.values());
   }

    return res.status(200).json(posts);
  } catch (error) {
    console.error('Posts fetch error:', error);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
})

// Protected POST handler
const postHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  const { title, content, tags, templateId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    // Check if the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the template exists
    if (templateId) {
      const templateExists = await prisma.codeTemplate.findUnique({
        where: { id: templateId }
      });

      if (!templateExists) {
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    // Find existing tags
    const existingTags = await prisma.tag.findMany({
      where: {
        name: { in: tags }
      }
    });

    // Determine which tags need to be created
    const existingTagNames = existingTags.map(tag => tag.name);
    const newTagNames = tags.filter((tagName: string) => !existingTagNames.includes(tagName));

    // Create new tags individually
    for (const name of newTagNames) {
      await prisma.tag.create({
        data: { name }
      });
    }

    // Connect all tags to the post
    const allTagNames = [...existingTagNames, ...newTagNames];

    const post = await prisma.blogPost.create({
      data: {
        title,
        content,
        author: {
          connect: { id: userId }
        },
        tags: {
          connect: allTagNames.map((name: string) => ({ name }))
        },
        ...(templateId && {
          links: {
            connect: { id: templateId }
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

    return res.status(201).json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

const adminHandler = withAdminAuth(async (req: NextApiRequest, res: NextApiResponse, userId: number) => {
  const { id } = req.query;
  const { hiddenFlag } = req.body;

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
});
  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return getHandler(req, res);
  }
  
  if (req.method === "POST") {
    return postHandler(req, res);
  }

  if (req.method === "PUT") {
    return adminHandler(req, res);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

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
  return res.status(405).json({ error: "Method not allowed" });
} 