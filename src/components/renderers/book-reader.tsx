"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TocHeading } from "@/lib/parsers/markdown-parser";

interface EpubTocItem {
  label?: string;
  href?: string;
  subitems?: EpubTocItem[];
}

interface TxtRendererProps {
  content?: string;
  url?: string;
  className?: string;
}

// 动态导入渲染器，避免 SSR 问题
const MarkdownRenderer = dynamic(
  () => import("./markdown-renderer").then((mod) => mod.MarkdownRenderer),
  {
    loading: () => <ContentSkeleton />,
    ssr: false,
  }
);

const EpubRenderer = dynamic(
  () => import("./epub-renderer").then((mod) => mod.EpubRenderer),
  {
    loading: () => <ContentSkeleton />,
    ssr: false,
  }
);

const PdfRenderer = dynamic(
  () => import("./pdf-renderer").then((mod) => mod.PdfRenderer),
  {
    loading: () => <ContentSkeleton />,
    ssr: false,
  }
);

const TxtRenderer: ComponentType<TxtRendererProps> = dynamic(
  () => import("@/components/renderers/txt-renderer").then((mod) => mod.TxtRenderer),
  {
    loading: () => <ContentSkeleton />,
    ssr: false,
  }
);

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

interface BookReaderProps {
  format: "markdown" | "epub" | "pdf" | "txt";
  content?: string; // Markdown/TXT 内容
  url?: string; // EPUB/PDF/TXT 文件 URL
  className?: string;
  onTocLoad?: (toc: EpubTocItem[]) => void;
  onHeadingsLoad?: (headings: TocHeading[]) => void;
  onEpubNavigateReady?: (navigate: (href: string) => void) => void;
}

export function BookReader({
  format,
  content,
  url,
  className,
  onTocLoad,
  onHeadingsLoad,
  onEpubNavigateReady,
}: BookReaderProps) {
  switch (format) {
    case "markdown":
      if (!content) return <div>没有内容</div>;
      return <MarkdownRenderer content={content} className={className} onHeadingsLoad={onHeadingsLoad} />;

    case "epub":
      if (!url) return <div>没有 EPUB 文件</div>;
      return <EpubRenderer url={url} className={className} onTocLoad={onTocLoad} onNavigate={onEpubNavigateReady} />;

    case "pdf":
      if (!url) return <div>没有 PDF 文件</div>;
      return <PdfRenderer url={url} className={className} />;

    case "txt":
      if (!content && !url) return <div>没有内容</div>;
      return <TxtRenderer content={content} url={url} className={className} />;

    default:
      return <div>不支持的格式: {format}</div>;
  }
}
