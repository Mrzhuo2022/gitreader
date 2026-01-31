"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Settings, Type, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useReaderStore, FONT_OPTIONS } from "@/stores/reader-store";
import { ThemeToggle } from "@/components/theme-toggle";

interface TxtRendererProps {
  content?: string;
  url?: string;
  className?: string;
}

// 每次渲染的字符数量（约 50KB）
const CHUNK_SIZE = 50000;

export function TxtRenderer({ content, url, className }: TxtRendererProps) {
  const [fullText, setFullText] = useState(""); // 完整文本
  const [displayedLength, setDisplayedLength] = useState(CHUNK_SIZE); // 已显示的字符数
  const [loading, setLoading] = useState(!content && !!url);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    contentWidth,
    setContentWidth,
  } = useReaderStore();

  // 获取当前字体的 CSS font-family
  const currentFontFamily = FONT_OPTIONS.find(f => f.value === fontFamily)?.family || FONT_OPTIONS[0].family;

  // 加载文本
  useEffect(() => {
    if (content) {
      setFullText(content);
      setDisplayedLength(Math.min(CHUNK_SIZE, content.length));
      return;
    }

    if (!url) return;

    const fetchText = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const textContent = await response.text();
        setFullText(textContent);
        setDisplayedLength(Math.min(CHUNK_SIZE, textContent.length));
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [content, url]);

  // 获取当前显示的文本
  const displayedText = fullText.slice(0, displayedLength);
  const hasMore = displayedLength < fullText.length;
  const progress = fullText.length > 0 ? Math.round((displayedLength / fullText.length) * 100) : 100;

  // 将显示的文本按段落分割
  const paragraphs = displayedText.split(/\n\n+/).filter(Boolean);

  // 监听滚动，动态加载更多内容
  useEffect(() => {
    if (!hasMore) return;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // 当滚动到底部 80% 时，加载更多内容
      if (scrollY + windowHeight > docHeight * 0.8 && !isProcessing) {
        setIsProcessing(true);
        // 使用 requestIdleCallback 或 setTimeout 来避免阻塞
        const loadMore = () => {
          setDisplayedLength(prev => Math.min(prev + CHUNK_SIZE, fullText.length));
          setIsProcessing(false);
        };
        
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(loadMore);
        } else {
          setTimeout(loadMore, 0);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, fullText.length, isProcessing]);

  const increaseFontSize = useCallback(() => {
    setFontSize(Math.min(fontSize + 2, 28));
  }, [fontSize, setFontSize]);

  const decreaseFontSize = useCallback(() => {
    setFontSize(Math.max(fontSize - 2, 12));
  }, [fontSize, setFontSize]);

  const increaseLineHeight = useCallback(() => {
    setLineHeight(Math.min(lineHeight + 0.25, 3));
  }, [lineHeight, setLineHeight]);

  const decreaseLineHeight = useCallback(() => {
    setLineHeight(Math.max(lineHeight - 0.25, 1.25));
  }, [lineHeight, setLineHeight]);

  // 加载全部内容
  const loadAll = useCallback(() => {
    setDisplayedLength(fullText.length);
  }, [fullText.length]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="text-destructive">错误: {error}</div>
      </div>
    );
  }

  return (
    <div className={className} ref={containerRef}>
      {/* 阅读控制栏 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={decreaseFontSize} title="缩小字体">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm text-muted-foreground w-10 text-center">{fontSize}px</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={increaseFontSize} title="放大字体">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      字体大小
                    </label>
                    <span className="text-sm text-muted-foreground">{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={decreaseFontSize}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${((fontSize - 12) / 16) * 100}%` }}
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
                <div className="pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => { setFontSize(16); setLineHeight(1.75); setFontFamily("lxgw"); }}
                  >
                    重置为默认
                  </Button>
                </div>
                <div className="pt-2 border-t">
                  <label className="text-sm font-medium mb-2 block">字体</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FONT_OPTIONS.map((font) => (
                      <Button
                        key={font.value}
                        variant={fontFamily === font.value ? "secondary" : "outline"}
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => setFontFamily(font.value)}
                        style={{ fontFamily: font.family }}
                      >
                        {font.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t">
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
              </div>
            </PopoverContent>
          </Popover>
          <ThemeToggle />
        </div>
      </div>

      {/* TXT 内容 */}
      <article
        className={cn(
          "prose max-w-none",
          resolvedTheme === "dark" ? "prose-invert" : ""
        )}
        style={{ fontSize: `${fontSize}px`, lineHeight, fontFamily: currentFontFamily }}
      >
        <div>
          {paragraphs.map((paragraph, index) => {
            // 检查是否是代码块（以空格或制表符开头的多行）
            const lines = paragraph.split("\n");
            const isCodeLike = lines.every(
              (line) => line.startsWith("  ") || line.startsWith("\t") || line === ""
            );

            if (isCodeLike && lines.length > 1) {
              return (
                <pre
                  key={index}
                  className="bg-muted rounded-md p-4 overflow-x-auto text-sm my-4"
                >
                  <code>{paragraph}</code>
                </pre>
              );
            }

            // 普通段落：保留单个换行作为 <br>
            return (
              <p key={index} className="my-4 text-indent-2em">
                {lines.map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex < lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            );
          })}
        </div>

        {/* 自动加载更多 - 简洁提示 */}
        {hasMore && (
          <div className="flex justify-center py-6">
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
            ) : (
              <div className="h-5" /> 
            )}
          </div>
        )}
      </article>
    </div>
  );
}
