"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bookmark,
  BookmarkPlus,
  Trash2,
  Clock,
  Loader2,
} from "lucide-react";

export interface BookmarkItem {
  id: string;
  chapterSlug?: string | null;
  position?: string | null;
  title?: string | null;
  note?: string | null;
  createdAt: string;
}

interface BookmarkPosition {
  scrollY?: number;
  chapterSlug?: string;
  percentage?: number;
}

interface BookmarkListProps {
  bookSlug: string;
  currentChapter?: string;
  currentChapterTitle?: string; // 当前章节标题（来自目录）
  onNavigate?: (bookmark: BookmarkItem) => void;
  className?: string;
}

export function BookmarkList({
  bookSlug,
  currentChapter,
  currentChapterTitle,
  onNavigate,
  className,
}: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // 获取书签列表
  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${bookSlug}/bookmarks`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [bookSlug]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // 添加书签
  const addBookmark = async () => {
    setIsAdding(true);
    try {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = docHeight > 0 ? Math.round((scrollY / docHeight) * 100) : 0;

      const position: BookmarkPosition = {
        scrollY,
        chapterSlug: currentChapter,
        percentage,
      };

      // 书签命名：使用目录章节标题 + 进度
      // currentChapterTitle 来自目录，是用户当前阅读的章节名
      let title = "";
      
      if (currentChapterTitle) {
        title = `${currentChapterTitle} (${percentage}%)`;
      } else {
        title = `阅读位置 ${percentage}%`;
      }

      const res = await fetch(`/api/books/${bookSlug}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterSlug: currentChapter,
          position: JSON.stringify(position),
          title,
        }),
      });

      if (res.ok) {
        await fetchBookmarks();
      }
    } catch (error) {
      console.error("Failed to add bookmark:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // 删除书签
  const deleteBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/books/${bookSlug}/bookmarks?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    }
  };

  // 跳转到书签位置
  const navigateToBookmark = (bookmark: BookmarkItem) => {
    if (onNavigate) {
      onNavigate(bookmark);
    } else if (bookmark.position) {
      try {
        const pos = JSON.parse(bookmark.position) as BookmarkPosition;
        if (pos.scrollY !== undefined) {
          window.scrollTo({ top: pos.scrollY, behavior: "smooth" });
        }
      } catch {
        // 忽略解析错误
      }
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          <span className="text-sm font-medium">书签</span>
          {bookmarks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({bookmarks.length})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={addBookmark}
          disabled={isAdding}
        >
          {isAdding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BookmarkPlus className="h-3.5 w-3.5" />
          )}
          <span className="text-xs">添加</span>
        </Button>
      </div>

      {/* 书签列表 */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bookmark className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">暂无书签</p>
            <p className="text-xs mt-1">点击上方添加按钮创建书签</p>
          </div>
        ) : (
          <div className="py-2">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group px-4 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigateToBookmark(bookmark)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 leading-snug">
                      {bookmark.title || "未命名书签"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatTime(bookmark.createdAt)}</span>
                    </div>
                    {bookmark.note && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {bookmark.note}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                    onClick={(e) => deleteBookmark(bookmark.id, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
