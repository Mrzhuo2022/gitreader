"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Book, Library, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  bookTitle?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({
  bookTitle,
  onMenuClick,
  showMenuButton = false,
}: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Book className="h-5 w-5" />
          <span className="hidden sm:inline">GitReader</span>
        </Link>

        {bookTitle && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium truncate max-w-50">
              {bookTitle}
            </span>
          </>
        )}

        <div className="flex-1" />

        <nav className="flex items-center gap-1">
          <Link href="/library">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2",
                pathname === "/library" && "bg-accent"
              )}
            >
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">书库</span>
            </Button>
          </Link>
          <Link href="/admin/upload">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2",
                pathname === "/admin/upload" && "bg-accent"
              )}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">上传</span>
            </Button>
          </Link>
          
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
