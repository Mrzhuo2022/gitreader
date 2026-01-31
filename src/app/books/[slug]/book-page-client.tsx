"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ReaderLayout } from "@/components/reader/reader-layout";
import { BookReader } from "@/components/renderers/book-reader";
import { TocItem } from "@/components/reader/table-of-contents";
import { readFile } from "@/lib/file-utils";
import { TocHeading } from "@/lib/parsers/markdown-parser";
import { useReaderStore } from "@/stores/reader-store";

interface EpubTocItem {
  label?: string;
  href?: string;
  subitems?: EpubTocItem[];
}

interface Book {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  description: string | null;
  format: string;
  filePath: string;
  chapters: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
    content: string | null;
  }>;
}

interface BookPageClientProps {
  book: Book;
}

export function BookPageClient({ book }: BookPageClientProps) {
  const [content, setContent] = useState<string>("");
  const [toc, setToc] = useState<TocItem[]>([]);
  const epubNavigateRef = useRef<((href: string) => void) | null>(null);
  const { currentChapter, setCurrentChapter } = useReaderStore();

  // 打开新书时重置当前章节
  useEffect(() => {
    setCurrentChapter(null);
  }, [book.slug, setCurrentChapter]);

  // 为 Markdown/TXT 格式书籍加载内容
  useEffect(() => {
    if (book.format === "markdown" || book.format === "txt") {
      const loadContent = async () => {
        // 如果有章节且包含内容，优先使用数据库中的内容
        if (book.chapters.length > 0) {
          const tocItems: TocItem[] = book.chapters.map((ch) => ({
            title: ch.title,
            slug: ch.slug,
          }));
          setToc(tocItems);

          if (book.chapters[0]?.content) {
            setContent(book.chapters[0].content);
            return;
          }
        }
        
        // 如果数据库中没有内容，尝试从文件加载
        if (book.filePath) {
          try {
            const fileContent = await readFile(book.filePath);
            setContent(fileContent);
          } catch (error) {
            console.error("Failed to load content:", error);
          }
        }
      };

      loadContent();
    }
  }, [book]);

  // 处理 EPUB 目录加载
  const handleEpubTocLoad = useCallback((epubToc: EpubTocItem[]) => {
    const convertToc = (items: EpubTocItem[]): TocItem[] => {
      return items.map((item, index) => ({
        title: item.label || `章节 ${index + 1}`,
        slug: item.href || `chapter-${index}`,
        children: item.subitems ? convertToc(item.subitems) : undefined,
      }));
    };
    setToc(convertToc(epubToc));
  }, []);

  // 处理 Markdown 标题加载，自动生成目录
  const handleHeadingsLoad = useCallback((headings: TocHeading[]) => {
    const tocItems: TocItem[] = headings.map((h) => ({
      title: h.text,
      slug: h.id,
    }));
    setToc(tocItems);
  }, []);

  // 处理目录点击 - 根据格式进行不同处理
  const handleTocClick = useCallback((slug: string) => {
    setCurrentChapter(slug);
    if (book.format === "epub" && epubNavigateRef.current) {
      // EPUB: 使用 EPUB 渲染器的导航方法
      epubNavigateRef.current(slug);
    } else {
      // Markdown/其他: 滚动到对应锚点
      const element = document.getElementById(slug);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [book.format, setCurrentChapter]);

  // 保存 EPUB 导航方法的引用
  const handleEpubNavigateReady = useCallback((navigate: (href: string) => void) => {
    epubNavigateRef.current = navigate;
  }, []);

  return (
    <ReaderLayout
      bookSlug={book.slug}
      bookTitle={book.title}
      toc={toc}
      onTocItemClick={handleTocClick}
      currentChapter={currentChapter ?? undefined}
    >
      {/* 书籍头部信息 - 仅在有作者或简介时显示 */}
      {(book.author || book.description) && (
        <header className="mb-10 pb-6 border-b">
          <h1 className="text-3xl font-bold tracking-tight mb-3">{book.title}</h1>
          {book.author && (
            <p className="text-muted-foreground">作者：{book.author}</p>
          )}
          {book.description && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{book.description}</p>
          )}
        </header>
      )}

      <BookReader
        format={book.format as "markdown" | "epub" | "pdf" | "txt"}
        content={content}
        url={book.filePath}
        onTocLoad={handleEpubTocLoad}
        onHeadingsLoad={handleHeadingsLoad}
        onEpubNavigateReady={handleEpubNavigateReady}
      />
    </ReaderLayout>
  );
}
