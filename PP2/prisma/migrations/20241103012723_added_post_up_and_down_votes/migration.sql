/*
  Warnings:

  - You are about to drop the column `ratings` on the `blogPost` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_blogPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "authorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "hiddenFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_blogPost" ("authorId", "content", "createdAt", "hiddenFlag", "id", "title") SELECT "authorId", "content", "createdAt", "hiddenFlag", "id", "title" FROM "blogPost";
DROP TABLE "blogPost";
ALTER TABLE "new_blogPost" RENAME TO "blogPost";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
