"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  bookSlug: string;
  prevChapter?: { slug: string; title: string } | null;
  nextChapter?: { slug: string; title: string } | null;
}

export function ChapterNavigation({
  bookSlug,
  prevChapter,
  nextChapter,
}: NavigationProps) {
  return (
    <div className="flex items-center justify-between py-8 border-t mt-12">
      {prevChapter ? (
        <Link href={`/books/${bookSlug}/${prevChapter.slug}`}>
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">上一章</div>
              <div className="text-sm font-medium">{prevChapter.title}</div>
            </div>
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {nextChapter ? (
        <Link href={`/books/${bookSlug}/${nextChapter.slug}`}>
          <Button variant="ghost" className="gap-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">下一章</div>
              <div className="text-sm font-medium">{nextChapter.title}</div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
