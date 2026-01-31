"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export interface TocItem {
  title: string;
  slug: string;
  children?: TocItem[];
}

interface TableOfContentsProps {
  items: TocItem[];
  bookSlug: string;
  className?: string;
  onItemClick?: (slug: string) => void;
}

function TocLink({
  item,
  bookSlug,
  depth = 0,
  onItemClick,
}: {
  item: TocItem;
  bookSlug: string;
  depth?: number;
  onItemClick?: (slug: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (onItemClick) {
      onItemClick(item.slug);
    }
  };

  return (
    <div>
      <div className="flex items-center group">
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-accent rounded-sm mr-0.5 opacity-60 hover:opacity-100"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                isOpen && "rotate-90"
              )}
            />
          </button>
        )}
        <button
          onClick={handleClick}
          className={cn(
            "flex-1 py-1.5 px-2 text-[13px] rounded-md transition-colors text-left",
            "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            "wrap-break-word whitespace-normal leading-snug",
            !hasChildren && "ml-4"
          )}
          style={{ paddingLeft: depth > 0 ? `${depth * 12 + 8}px` : undefined }}
        >
          {item.title}
        </button>
      </div>
      {hasChildren && isOpen && (
        <div className="ml-1">
          {item.children!.map((child) => (
            <TocLink
              key={child.slug}
              item={child}
              bookSlug={bookSlug}
              depth={depth + 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TableOfContents({
  items,
  bookSlug,
  className,
  onItemClick,
}: TableOfContentsProps) {
  if (items.length === 0) {
    return (
      <div className={cn("p-4 text-sm text-muted-foreground", className)}>
        暂无目录
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <nav className="p-3 space-y-0.5">
        {items.map((item) => (
          <TocLink key={item.slug} item={item} bookSlug={bookSlug} onItemClick={onItemClick} />
        ))}
      </nav>
    </ScrollArea>
  );
}
