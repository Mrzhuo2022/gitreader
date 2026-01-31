"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TableOfContents, TocItem } from "@/components/reader/table-of-contents";
import { PageOutline } from "@/components/reader/page-outline";
import { BookmarkList, BookmarkItem } from "@/components/reader/bookmark-list";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useReaderStore } from "@/stores/reader-store";
import { Menu, ChevronLeft, PanelLeftClose, PanelLeft, ArrowUp, List, Bookmark } from "lucide-react";

type SidebarTab = "toc" | "bookmarks";

interface ReaderLayoutProps {
  children: ReactNode;
  bookSlug: string;
  bookTitle: string;
  toc: TocItem[];
  onTocItemClick?: (slug: string) => void;
  currentChapter?: string;
}

// 从目录中查找章节标题
function findChapterTitle(toc: TocItem[], slug: string | undefined): string | undefined {
  if (!slug) return undefined;
  
  for (const item of toc) {
    if (item.slug === slug) {
      return item.title;
    }
    if (item.children) {
      const found = findChapterTitle(item.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}

export function ReaderLayout({
  children,
  bookSlug,
  bookTitle,
  toc,
  onTocItemClick,
  currentChapter,
}: ReaderLayoutProps) {
  const { sidebarOpen, setSidebarOpen, contentWidth } = useReaderStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("toc");

  // 获取当前章节标题（从目录中查找）
  const currentChapterTitle = findChapterTitle(toc, currentChapter);

  // 滚动到书签位置
  const scrollToPosition = useCallback((pos: { scrollY?: number; percentage?: number }) => {
    // 首先尝试使用 scrollY
    if (pos.scrollY !== undefined && pos.scrollY > 0) {
      window.scrollTo({ top: pos.scrollY, behavior: "smooth" });
      return;
    }
    
    // 如果 scrollY 无效，使用百分比计算位置
    if (pos.percentage !== undefined) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = Math.round((pos.percentage / 100) * docHeight);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }, []);

  // 处理书签跳转
  const handleBookmarkNavigate = (bookmark: BookmarkItem) => {
    if (bookmark.position) {
      try {
        const pos = JSON.parse(bookmark.position);
        // 如果章节不同，先切换章节
        if (pos.chapterSlug && pos.chapterSlug !== currentChapter) {
          onTocItemClick?.(pos.chapterSlug);
          // 延迟滚动，等待章节加载完成
          setTimeout(() => {
            scrollToPosition(pos);
          }, 500);
        } else {
          scrollToPosition(pos);
        }
      } catch {
        // 忽略解析错误
      }
    }
    setMobileMenuOpen(false);
  };

  const widthClass = {
    narrow: "max-w-2xl",
    normal: "max-w-3xl",
    wide: "max-w-4xl",
  }[contentWidth];

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      const { scrollTop, scrollHeight } = document.documentElement;
      const total = scrollHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(scrollTop / total, 1) : 0;

      setScrollProgress(progress);
      setShowBackToTop(scrollTop > 600);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 阅读进度条 */}
      <div className="fixed top-0 left-0 right-0 h-1 md:h-0.5 z-60 bg-border/60">
        <div
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* 简洁的移动端顶部栏 */}
      <header className="md:hidden sticky top-0 z-50 w-full h-14 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 flex items-center px-4 gap-3 safe-top">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 -ml-2 active:scale-95 transition-transform"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-base font-medium truncate flex-1">{bookTitle}</span>
      </header>

      {/* 移动端侧边栏 */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[80vw] max-w-xs p-0">
          <SheetTitle className="sr-only">目录导航</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b">
              <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 active:opacity-70 transition-opacity">
                <ChevronLeft className="h-4 w-4" />
                返回书库
              </Link>
              <h2 className="font-semibold mt-2 text-base line-clamp-2">{bookTitle}</h2>
            </div>
            
            {/* 标签切换 */}
            <div className="flex border-b">
              <button
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors",
                  sidebarTab === "toc" 
                    ? "text-foreground border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSidebarTab("toc")}
              >
                <List className="h-4 w-4" />
                目录
              </button>
              <button
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors",
                  sidebarTab === "bookmarks" 
                    ? "text-foreground border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSidebarTab("bookmarks")}
              >
                <Bookmark className="h-4 w-4" />
                书签
              </button>
            </div>

            {/* 内容区 */}
            {sidebarTab === "toc" ? (
              <TableOfContents 
                items={toc} 
                bookSlug={bookSlug} 
                onItemClick={(slug) => { onTocItemClick?.(slug); setMobileMenuOpen(false); }} 
                className="flex-1 overscroll-contain"
              />
            ) : (
              <BookmarkList
                bookSlug={bookSlug}
                currentChapter={currentChapter}
                currentChapterTitle={currentChapterTitle}
                onNavigate={handleBookmarkNavigate}
                className="flex-1 overscroll-contain"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 relative">
        {/* 桌面端左侧边栏 - 目录 (全高) */}
        <aside
          className={cn(
            "hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-72 border-r bg-sidebar/50 backdrop-blur transition-transform z-40 overflow-hidden",
            !sidebarOpen && "-translate-x-full"
          )}
        >
          {/* 侧边栏头部: 返回按钮 + 标题 + 收起按钮 */}
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link 
                href="/library" 
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1.5 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                书库
              </Link>
              <h2 
                className="font-semibold text-sm truncate" 
                title={bookTitle}
              >
                {bookTitle}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* 标签切换 */}
          <div className="flex border-b">
            <button
              className={cn(
                "flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors",
                sidebarTab === "toc" 
                  ? "text-foreground border-b-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setSidebarTab("toc")}
            >
              <List className="h-3.5 w-3.5" />
              目录
            </button>
            <button
              className={cn(
                "flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors",
                sidebarTab === "bookmarks" 
                  ? "text-foreground border-b-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setSidebarTab("bookmarks")}
            >
              <Bookmark className="h-3.5 w-3.5" />
              书签
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === "toc" ? (
              <TableOfContents 
                items={toc} 
                bookSlug={bookSlug} 
                className="flex-1 py-2" 
                onItemClick={onTocItemClick} 
              />
            ) : (
              <BookmarkList
                bookSlug={bookSlug}
                currentChapter={currentChapter}
                currentChapterTitle={currentChapterTitle}
                onNavigate={handleBookmarkNavigate}
                className="flex-1"
              />
            )}
          </div>
        </aside>

        {/* 桌面端: 侧边栏展开按钮 (当侧边栏收起时显示) */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex fixed left-4 top-4 z-50 h-8 w-8 bg-background border shadow-sm text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            title="展开目录"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        {showBackToTop && (
          <Button
            variant="secondary"
            size="icon"
            className="fixed bottom-6 right-4 z-50 h-11 w-11 shadow-lg active:scale-95 transition-transform md:bottom-8 md:right-8 md:h-10 md:w-10 safe-bottom"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="回到顶部"
          >
            <ArrowUp className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
        )}

        {/* 主内容区 - 始终居中，不受侧边栏影响 */}
        <main className="flex-1 min-h-screen w-full">
          <article
            className={cn(
              "mx-auto px-4 pt-4 pb-8 sm:px-6 sm:pt-6 md:py-16",
              widthClass
            )}
          >
            {children}
          </article>
        </main>

        {/* 桌面端右侧边栏 - 页面大纲 */}
        <aside 
          className={cn(
            "hidden xl:block fixed right-0 top-0 bottom-0 w-52 bg-background/50 backdrop-blur-sm overflow-hidden transition-transform duration-300",
            sidebarOpen ? "translate-x-0 border-l" : "translate-x-full"
          )}
        >
          <PageOutline />
        </aside>
      </div>
    </div>
  );
}