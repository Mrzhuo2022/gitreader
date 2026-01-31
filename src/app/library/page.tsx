"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Book, FileText, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { useLibraryStore, type Book as BookType } from "@/stores/library-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatLabels: Record<string, string> = {
  markdown: "MD",
  epub: "EPUB",
  pdf: "PDF",
  txt: "TXT",
};

const formatColors: Record<string, string> = {
  markdown: "bg-green-500/10 text-green-600 dark:text-green-400",
  epub: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pdf: "bg-red-500/10 text-red-600 dark:text-red-400",
  txt: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

// 格式对应的封面占位颜色
const placeholderColors: Record<string, string> = {
  markdown: "from-green-500/20 to-green-600/30",
  epub: "from-blue-500/20 to-blue-600/30",
  pdf: "from-red-500/20 to-red-600/30",
  txt: "from-yellow-500/20 to-yellow-600/30",
};

function BookCard({ book, onDelete }: { book: BookType; onDelete: (slug: string) => void }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete(book.slug);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Link href={`/books/${book.slug}`} className="group">
        <div className="flex flex-col">
          {/* 封面区域 */}
          <div className="relative aspect-2/3 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
            {book.cover ? (
              <Image
                src={book.cover}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              // 无封面时的占位符
              <div className={`w-full h-full bg-linear-to-br ${placeholderColors[book.format] || placeholderColors.epub} flex flex-col items-center justify-center p-4`}>
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground/70 text-center line-clamp-3 font-medium">
                  {book.title}
                </p>
              </div>
            )}
            
            {/* 删除按钮 */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* 格式标签 */}
            <Badge
              variant="secondary"
              className={`absolute bottom-2 left-2 ${formatColors[book.format] || ""} text-xs px-1.5 py-0.5`}
            >
              {formatLabels[book.format] || book.format.toUpperCase()}
            </Badge>
          </div>

          {/* 书籍信息 */}
          <div className="mt-3 px-1">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {book.author}
              </p>
            )}
          </div>
        </div>
      </Link>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除《{book.title}》吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function LibraryPage() {
  const { books, setBooks, removeBook, isLoading, setIsLoading } = useLibraryStore();
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "未知错误";

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/books");
        if (!res.ok) throw new Error("获取书籍失败");
        const data = await res.json();
        setBooks(data);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [setBooks, setIsLoading]);

  const handleDelete = async (slug: string) => {
    try {
      const res = await fetch(`/api/books/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      removeBook(slug);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Book className="h-8 w-8" />
              我的书库
            </h1>
            <p className="text-muted-foreground mt-1">
              共 {books.length} 本书籍
            </p>
          </div>
          <Link href="/admin/upload">
            <Button>上传新书</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-destructive">
            <p>{error}</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">书库为空</h2>
            <p className="text-muted-foreground mb-4">
              还没有任何书籍，开始上传你的第一本书吧！
            </p>
            <Link href="/admin/upload">
              <Button>上传书籍</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
