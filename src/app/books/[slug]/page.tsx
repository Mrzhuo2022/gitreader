import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BookPageClient } from "./book-page-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;

  const book = await prisma.book.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!book) {
    notFound();
  }

  return <BookPageClient book={book} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    select: { title: true, author: true, description: true },
  });

  if (!book) return { title: "书籍不存在" };

  return {
    title: `${book.title} - GitReader`,
    description: book.description || `阅读《${book.title}》`,
  };
}
