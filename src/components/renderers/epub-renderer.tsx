"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Minus, Plus, Settings, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useReaderStore, FONT_OPTIONS } from "@/stores/reader-store";
import { ThemeToggle } from "@/components/theme-toggle";

interface EpubTocItem {
  label?: string;
  href?: string;
  subitems?: EpubTocItem[];
}

type EpubRendition = {
  display: (href?: string) => Promise<void> | void;
  prev: () => void;
  next: () => void;
  themes: {
    register: (name: string, rules: Record<string, Record<string, string>>) => void;
    select: (name: string) => void;
    fontSize: (size: string) => void;
    override: (prop: string, value: string) => void;
  };
};

type EpubBook = {
  ready: Promise<void>;
  renderTo: (
    element: HTMLElement,
    options: { 
      width: string; 
      height: string; 
      allowScriptedContent: boolean;
      flow?: "paginated" | "scrolled-doc" | "scrolled";
      spread?: "none" | "auto";
    }
  ) => EpubRendition;
  loaded: {
    navigation: Promise<{ toc?: EpubTocItem[] }>;
  };
  destroy: () => void;
};

// type EpubFactory = (url: string) => EpubBook;

interface EpubRendererProps {
  url: string;
  className?: string;
  onTocLoad?: (toc: EpubTocItem[]) => void;
  onNavigate?: (navigate: (href: string) => void) => void;
}

export function EpubRenderer({ url, className, onTocLoad, onNavigate }: EpubRendererProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<EpubRendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(100);
  const [isReady, setIsReady] = useState(false);
  const { lineHeight, setLineHeight, contentWidth, setContentWidth, fontFamily, setFontFamily } = useReaderStore();

  // 获取当前字体的 CSS font-family 值
  const currentFontFamily = FONT_OPTIONS.find((f) => f.value === fontFamily)?.family || FONT_OPTIONS[0].family;
  const { resolvedTheme } = useTheme();

  // 使用 ref 存储回调，避免 useEffect 依赖变化导致无限循环
  const onTocLoadRef = useRef(onTocLoad);
  const onNavigateRef = useRef(onNavigate);
  
  useEffect(() => {
    onTocLoadRef.current = onTocLoad;
  }, [onTocLoad]);
  
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  // 初始化
  useEffect(() => {
    let mounted = true;
    let book: EpubBook | null = null;

    const init = async () => {
      try {
        if (!mounted || !viewerRef.current) return;

        const [{ default: ePub }, { default: JSZip }] = await Promise.all([
          import("epubjs"),
          import("jszip"),
        ]);
        
        // 关键修复：epubjs 需要 JSZip 在全局对象上
        if (typeof window !== "undefined") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).JSZip = JSZip;
        }

        // 创建书籍实例
        const resolvedUrl = url.startsWith("http")
          ? url
          : new URL(url, window.location.href).toString();
          
        console.log("Loading EPUB from:", resolvedUrl);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        book = (ePub as any)(resolvedUrl);
        bookRef.current = book;

        // 等待书籍打开
        await book!.ready;
        console.log("EPUB book ready");

        if (!mounted || !viewerRef.current) return;

        // 创建渲染 - 使用滚动模式，每章完整显示
        const rendition = book!.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          allowScriptedContent: true,
          flow: "scrolled-doc", // 滚动模式，完整显示章节
          spread: "none", // 不分栏
        });
        renditionRef.current = rendition;

        // 注册主题 - 亮色模式
        if (rendition.themes && typeof rendition.themes.register === "function") {
          rendition.themes.register("light", {
            "body": {
              "line-height": "1.8",
              "padding": "20px 30px",
              "max-width": "100%",
              "background-color": "#ffffff",
              "color": "#1a1a1a",
            },
            "p": {
              "margin": "0 0 1em 0",
            },
            "a": {
              "color": "#2563eb",
            },
          });
          
          // 注册主题 - 暗色模式
          rendition.themes.register("dark", {
            "body": {
              "line-height": "1.8",
              "padding": "20px 30px",
              "max-width": "100%",
              "background-color": "#1c1c1e",
              "color": "#e5e5e7",
            },
            "p": {
              "margin": "0 0 1em 0",
            },
            "a": {
              "color": "#6eb5ff",
            },
          });
          
          // 根据当前系统主题选择
          const isDark = document.documentElement.classList.contains("dark");
          rendition.themes.select(isDark ? "dark" : "light");
        }

        // 显示第一页
        await rendition.display();

        if (!mounted) return;

        setIsLoading(false);
        setIsReady(true);

        // 加载导航
        const navigation = await book!.loaded.navigation;
        if (navigation?.toc && onTocLoadRef.current) {
          onTocLoadRef.current(navigation.toc);
        }

        // 暴露导航方法
        if (onNavigateRef.current) {
          onNavigateRef.current((href: string) => {
            if (renditionRef.current) {
              renditionRef.current.display(href);
            }
          });
        }

      } catch (err: unknown) {
        console.error("EPUB Error:", err);
        if (mounted) {
          const message = err instanceof Error ? err.message : "无法加载 EPUB 文件";
          setError(message);
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (book) {
        try {
          book.destroy();
        } catch {
          // ignore
        }
      }
      bookRef.current = null;
      renditionRef.current = null;
    };
  }, [url]); // 只依赖 url，回调通过 ref 访问

  // 响应主题变化 - 直接操作 iframe 内的样式
  useEffect(() => {
    if (!renditionRef.current || !isReady) return;
    
    const rendition = renditionRef.current;
    const theme = resolvedTheme === "dark" ? "dark" : "light";
    
    // 使用 themes.select 设置主题（检查 themes 是否存在）
    try {
      if (rendition.themes && typeof rendition.themes.select === "function") {
        rendition.themes.select(theme);
      }
    } catch (e) {
      console.warn("Failed to select theme:", e);
    }
    
    // 直接获取所有 iframe 并更新其样式
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const views = (rendition as any).views?.();
      if (views && typeof views.forEach === "function") {
        views.forEach((view: { document?: Document }) => {
          if (view.document) {
            const body = view.document.body;
            if (body) {
              if (theme === "dark") {
                body.style.backgroundColor = "#1c1c1e";
                body.style.color = "#e5e5e7";
              } else {
                body.style.backgroundColor = "#ffffff";
                body.style.color = "#1a1a1a";
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn("Failed to update iframe styles:", e);
    }
  }, [resolvedTheme, isReady]);

  // 字体大小
  useEffect(() => {
    if (renditionRef.current && isReady) {
      try {
        if (renditionRef.current.themes && typeof renditionRef.current.themes.fontSize === "function") {
          renditionRef.current.themes.fontSize(`${fontSize}%`);
        }
      } catch (e) {
        console.warn("Failed to set font size:", e);
      }
    }
  }, [fontSize, isReady]);

  useEffect(() => {
    if (renditionRef.current && isReady) {
      try {
        if (renditionRef.current.themes && typeof renditionRef.current.themes.override === "function") {
          renditionRef.current.themes.override("line-height", `${lineHeight}`);
        }
      } catch (e) {
        console.warn("Failed to set line height:", e);
      }
    }
  }, [lineHeight, isReady]);

  // 字体系列
  useEffect(() => {
    if (renditionRef.current && isReady) {
      try {
        if (renditionRef.current.themes && typeof renditionRef.current.themes.override === "function") {
          renditionRef.current.themes.override("font-family", currentFontFamily);
        }
      } catch (e) {
        console.warn("Failed to set font family:", e);
      }
    }
  }, [currentFontFamily, isReady]);

  const handlePrev = useCallback(() => {
    if (renditionRef.current && isReady) {
      try {
        renditionRef.current.prev();
      } catch (e) {
        console.warn("EPUB prev navigation failed:", e);
      }
    }
  }, [isReady]);

  const handleNext = useCallback(() => {
    if (renditionRef.current && isReady) {
      try {
        renditionRef.current.next();
      } catch (e) {
        console.warn("EPUB next navigation failed:", e);
      }
    }
  }, [isReady]);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 10, 200));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 10, 50));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize(100);
  }, []);

  const increaseLineHeight = useCallback(() => {
    setLineHeight(Math.min(lineHeight + 0.25, 3));
  }, [lineHeight, setLineHeight]);

  const decreaseLineHeight = useCallback(() => {
    setLineHeight(Math.max(lineHeight - 0.25, 1.25));
  }, [lineHeight, setLineHeight]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={decreaseFontSize} disabled={fontSize <= 50}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">{fontSize}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={increaseFontSize} disabled={fontSize >= 200}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">字体大小</label>
                  <span className="text-sm text-muted-foreground">{fontSize}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={decreaseFontSize}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((fontSize - 50) / 150) * 100}%` }}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={increaseFontSize}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">行高</label>
                  <span className="text-sm text-muted-foreground">{lineHeight.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={decreaseLineHeight}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((lineHeight - 1.25) / 1.75) * 100}%` }}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={increaseLineHeight}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">阅读宽度</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={contentWidth === "narrow" ? "secondary" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setContentWidth("narrow")}
                  >
                    窄
                  </Button>
                  <Button
                    variant={contentWidth === "normal" ? "secondary" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setContentWidth("normal")}
                  >
                    标准
                  </Button>
                  <Button
                    variant={contentWidth === "wide" ? "secondary" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setContentWidth("wide")}
                  >
                    宽
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">字体</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {FONT_OPTIONS.map((font) => (
                    <Button
                      key={font.value}
                      variant={fontFamily === font.value ? "secondary" : "outline"}
                      size="sm"
                      className="text-xs px-2"
                      onClick={() => setFontFamily(font.value)}
                    >
                      {font.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    resetFontSize();
                    setLineHeight(1.75);
                    setFontFamily("lxgw");
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                  重置为默认
                </Button>
              </div>
              </div>
            </PopoverContent>
          </Popover>
          <ThemeToggle />
        </div>
      </div>

      {/* 内容区 - 滚动模式 */}
      <div className="relative w-full">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 bg-background/80 backdrop-blur-sm">
            <div className="space-y-4 w-full max-w-md px-6">
              <Skeleton className="h-6 w-2/3 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <p className="text-center text-sm text-muted-foreground mt-4">正在加载书籍...</p>
            </div>
          </div>
        )}
        
        {/* Viewer Container - 滚动模式下自适应高度 */}
        <div
          ref={viewerRef}
          className="bg-card border rounded-lg overflow-hidden w-full"
          style={{ 
            visibility: isLoading ? "hidden" : "visible",
            minHeight: isLoading ? "0" : "auto"
          }}
        />
      </div>

      {/* 章节导航 */}
      <div className={`flex items-center justify-center gap-4 mt-6 pt-4 border-t transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          <Button variant="outline" onClick={handlePrev} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            上一章
          </Button>
          <Button variant="outline" onClick={handleNext} className="gap-2">
            下一章
            <ChevronRight className="h-4 w-4" />
          </Button>
      </div>
    </div>
  );
}
