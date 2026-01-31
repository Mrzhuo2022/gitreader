-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "cover" TEXT,
    "format" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT,
    "filePath" TEXT,
    CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'anonymous',
    "chapterSlug" TEXT,
    "position" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Chapter_bookId_order_idx" ON "Chapter"("bookId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_bookId_slug_key" ON "Chapter"("bookId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_bookId_userId_key" ON "ReadingProgress"("bookId", "userId");
