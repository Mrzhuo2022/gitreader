import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ slug: string }>;
}

// GET /api/books/[slug] - 获取单本书籍详情
export async function GET(request: NextRequest, { params }: Params) {
  try {
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
      return NextResponse.json(
        { error: "书籍不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("Failed to fetch book:", error);
    return NextResponse.json(
      { error: "获取书籍失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[slug] - 删除书籍
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const book = await prisma.book.findUnique({ where: { slug } });

    if (!book) {
      return NextResponse.json(
        { error: "书籍不存在" },
        { status: 404 }
      );
    }

    await prisma.book.delete({ where: { slug } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Failed to delete book:", error);
    return NextResponse.json(
      { error: "删除书籍失败" },
      { status: 500 }
    );
  }
}

// PATCH /api/books/[slug] - 更新书籍信息
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const book = await prisma.book.findUnique({ where: { slug } });
    if (!book) {
      return NextResponse.json(
        { error: "书籍不存在" },
        { status: 404 }
      );
    }

    const updated = await prisma.book.update({
      where: { slug },
      data: {
        title: body.title,
        author: body.author,
        description: body.description,
        cover: body.cover,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update book:", error);
    return NextResponse.json(
      { error: "更新书籍失败" },
      { status: 500 }
    );
  }
}
