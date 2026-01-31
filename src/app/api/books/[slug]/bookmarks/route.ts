import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface BookmarkCreateBody {
  chapterSlug?: string;
  position?: string;
  title?: string;
  note?: string;
}

// GET /api/books/[slug]/bookmarks - 获取书籍的所有书签
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const book = await prisma.book.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: "书籍不存在" },
        { status: 404 }
      );
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { bookId: book.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    return NextResponse.json(
      { error: "获取书签失败" },
      { status: 500 }
    );
  }
}

// POST /api/books/[slug]/bookmarks - 添加书签
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as BookmarkCreateBody;

    const book = await prisma.book.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: "书籍不存在" },
        { status: 404 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        bookId: book.id,
        chapterSlug: body.chapterSlug,
        position: body.position,
        title: body.title,
        note: body.note,
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error("Failed to create bookmark:", error);
    return NextResponse.json(
      { error: "添加书签失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[slug]/bookmarks - 删除书签
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get("id");

    if (!bookmarkId) {
      return NextResponse.json(
        { error: "缺少书签 ID" },
        { status: 400 }
      );
    }

    // 验证书籍存在
    const book = await prisma.book.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: "书籍不存在" },
        { status: 404 }
      );
    }

    // 删除书签（确保属于该书籍）
    const deleted = await prisma.bookmark.deleteMany({
      where: {
        id: bookmarkId,
        bookId: book.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "书签不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bookmark:", error);
    return NextResponse.json(
      { error: "删除书签失败" },
      { status: 500 }
    );
  }
}
