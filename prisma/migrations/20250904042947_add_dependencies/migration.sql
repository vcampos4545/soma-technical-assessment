-- CreateTable
CREATE TABLE "TodoDependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "todoId" INTEGER NOT NULL,
    "dependencyId" INTEGER NOT NULL,
    CONSTRAINT "TodoDependency_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TodoDependency_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TodoDependency_todoId_idx" ON "TodoDependency"("todoId");

-- CreateIndex
CREATE INDEX "TodoDependency_dependencyId_idx" ON "TodoDependency"("dependencyId");

-- CreateIndex
CREATE UNIQUE INDEX "TodoDependency_todoId_dependencyId_key" ON "TodoDependency"("todoId", "dependencyId");
