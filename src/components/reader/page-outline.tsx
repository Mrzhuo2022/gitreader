"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface PageOutlineProps {
  className?: string;
}

export function PageOutline({ className }: PageOutlineProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 延迟提取标题，确保内容已渲染
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(
        ".prose h1, .prose h2, .prose h3"
      );
      const items: Heading[] = [];
      elements.forEach((el) => {
        if (el.id) {
          items.push({
            id: el.id,
            text: el.textContent || "",
            level: parseInt(el.tagName.charAt(1)),
          });
        }
      });
      setHeadings(items);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0% -80% 0%" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4 pt-6">
        <h4 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">
          本页内容
        </h4>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "block text-[13px] py-1 transition-colors leading-snug",
                heading.level === 2 && "pl-3",
                heading.level === 3 && "pl-6 text-xs",
                activeId === heading.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </ScrollArea>
  );
}
