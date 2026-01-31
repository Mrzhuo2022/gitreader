import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ChapterInput {
  title: string;
  slug: string;
  content?: string | null;
  filePath?: string | null;
}

interface CreateBookBody {
  title?: string;
  author?: string | null;
  description?: string | null;
  format?: string;
  slug?: string;
  filePath?: string;
  cover?: string | null;
  metadata?: Record<string, unknown> | null;
  chapters?: ChapterInput[];
}

// GET /api/books - 获取所有书籍
export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        author: true,
        description: true,
        cover: true,
        format: true,
        createdAt: true,
      },
    });
    return NextResponse.json(books);
  } catch (error) {
    console.error("Failed to fetch books:", error);
    return NextResponse.json(
      { error: "获取书籍列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/books - 创建新书籍（仅元数据，文件通过 /api/upload 上传）
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateBookBody;
    const { title, author, description, format, slug, filePath, cover, metadata, chapters } = body;

    if (!title || !format || !slug || !filePath) {
      return NextResponse.json(
        { error: "缺少必填字段: title, format, slug, filePath" },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existing = await prisma.book.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "该 URL 标识已存在" },
        { status: 409 }
      );
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        format,
        slug,
        filePath,
        cover,
        metadata: metadata ? JSON.stringify(metadata) : null,
        chapters: chapters
          ? {
              create: chapters.map((ch, index) => ({
                title: ch.title,
                slug: ch.slug,
                order: index,
                content: ch.content ?? null,
                filePath: ch.filePath ?? null,
              })),
            }
          : undefined,
      },
      include: { chapters: true },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Failed to create book:", error);
    return NextResponse.json(
      { error: "创建书籍失败" },
      { status: 500 }
    );
  }
}
