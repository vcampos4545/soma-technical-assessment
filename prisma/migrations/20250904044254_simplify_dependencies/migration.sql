/*
  Warnings:

  - You are about to drop the `TodoDependency` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "TodoDependency_todoId_dependencyId_key";

-- DropIndex
DROP INDEX "TodoDependency_dependencyId_idx";

-- DropIndex
DROP INDEX "TodoDependency_todoId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TodoDependency";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dependencies" TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO "new_Todo" ("createdAt", "dueDate", "id", "imageUrl", "title") SELECT "createdAt", "dueDate", "id", "imageUrl", "title" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
