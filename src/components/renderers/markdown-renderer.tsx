"use client";

import { parseMarkdown, TocHeading } from "@/lib/parsers/markdown-parser";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Settings, Type } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useReaderStore, FONT_OPTIONS } from "@/stores/reader-store";
import { ThemeToggle } from "@/components/theme-toggle";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onHeadingsLoad?: (headings: TocHeading[]) => void;
}

export function MarkdownRenderer({ content, className, onHeadingsLoad }: MarkdownRendererProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    parseMarkdown(content).then(({ html, headings }) => {
      setHtml(html);
      setIsLoading(false);
      if (onHeadingsLoad) {
        onHeadingsLoad(headings);
      }
    });
  }, [content, onHeadingsLoad]);

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

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
      </div>
    );
  }

  return (
    <div className={className}>
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

      {/* Markdown 内容 */}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        style={{ fontSize: `${fontSize}px`, lineHeight, fontFamily: currentFontFamily }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
