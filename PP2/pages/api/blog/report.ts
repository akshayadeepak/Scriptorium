import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { blogPostId, commentId, content } = req.body;

    if ((!blogPostId && !commentId) || (blogPostId && commentId)) {
      return res.status(400).json({ error: "Exactly one of blogPostId or commentId must be provided" });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: "Content is required and must be a string" });
    }
    try {
      // Check if the blog post or comment exists
      if (blogPostId) {
        const blogPostExists = await prisma.blogPost.findUnique({
          where: { id: Number(blogPostId) }
        });

        if (!blogPostExists) {
          return res.status(404).json({ error: "Blog post not found" });
        }
      } else if (commentId) {
        const commentExists = await prisma.comment.findUnique({
          where: { id: Number(commentId) }
        });

        if (!commentExists) {
          return res.status(404).json({ error: "Comment not found" });
        }
      }

      const reportData = {
        content,
        ...(blogPostId ? {
          blogPost: { connect: { id: blogPostId } }
        } : {
          comment: { connect: { id: commentId } }
        })
      };

      const report = await prisma.report.create({
        data: reportData,
        include: {
          blogPost: true,
          comment: true
        }
      });

      return res.status(201).json(report);
    } catch (error) {
      const err = error as Error;
      console.error('Report creation error:', err);
      return res.status(500).json({ 
        error: process.env.NODE_ENV === 'development' 
          ? `Failed to create report: ${err.message}` 
          : "Unable to create report" 
      });
    }
  } else if (req.method === "GET") {
    const { blogPostId, commentId } = req.query;

    try {
      if (blogPostId) {
        // Fetch reports for a specific blog post
        const reports = await prisma.report.findMany({
          where: { blogPostId: Number(blogPostId) },
          include: {
            blogPost: true,
            comment: true
          }
        });

        return res.status(200).json(reports);
      } else if (commentId) {
        // Fetch reports for a specific comment
        const reports = await prisma.report.findMany({
          where: { commentId: Number(commentId) },
          include: {
            blogPost: true,
            comment: true
          }
        });

        return res.status(200).json(reports);
      } else {
        return res.status(400).json({ error: "Either blogPostId or commentId must be provided" });
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching reports:', err);
      return res.status(500).json({ error: "Failed to fetch reports" });
    }
  } else if (req.method === "PUT") {
    const { reportId, content } = req.body;

    if (!reportId || !content || typeof content !== 'string') {
      return res.status(400).json({ error: "Report ID and content are required, and content must be a string" });
    }

    try {
      const existingReport = await prisma.report.findUnique({
        where: { id: reportId }
      });

      if (!existingReport) {
        return res.status(404).json({ error: "Report not found" });
      }

      const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: { content }
      });

      return res.status(200).json(updatedReport);
    } catch (error) {
      const err = error as Error;
      console.error('Error updating report:', err);
      return res.status(500).json({ error: "Failed to update report" });
    }
  } else if (req.method === "DELETE") {
    const { reportId } = req.query;

    // Check if reportId is provided and is a valid number
    if (!reportId || isNaN(Number(reportId))) {
      return res.status(400).json({ error: "Invalid or missing report ID" });
    }

    try {
      const reportIdNumber = Number(reportId);

      // Check if the report exists
      const existingReport = await prisma.report.findUnique({
        where: { id: reportIdNumber }
      });

      if (!existingReport) {
        return res.status(404).json({ error: "Report not found" });
      }

      await prisma.report.delete({
        where: { id: reportIdNumber }
      });

      return res.status(200).json({ message: "Report deleted successfully" });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Report not found or already deleted' });
      }
      console.error('Error deleting report:', error);
      return res.status(500).json({ error: "Failed to delete report" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 