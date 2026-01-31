"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface PdfRendererProps {
  url: string;
  className?: string;
}

export function PdfRenderer({ url, className }: PdfRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  
  // 拖动状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadPdfJs = async (): Promise<typeof import("pdfjs-dist") | null> => {
      // 使用 CDN 动态加载 pdf.js
      if (typeof window !== "undefined") {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        return pdfjsLib;
      }
      return null;
    };

    const initPdf = async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        if (!pdfjsLib) return;

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (err: unknown) {
        console.error("PDF loading error:", err);
        setError("无法加载 PDF 文件");
        setIsLoading(false);
      }
    };

    initPdf();
  }, [url]);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      // 清空容器
      containerRef.current!.innerHTML = "";

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        setError("无法初始化 PDF 渲染器");
        return;
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = "shadow-lg transition-transform";
      canvas.style.transform = `translate(${position.x}px, ${position.y}px)`;
      containerRef.current!.appendChild(canvas);

      await page.render({
        canvasContext: context,
        canvas,
        viewport,
      }).promise;
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, position]);

  // 鼠标滚轮缩放 - 使用 useEffect 添加非 passive 事件监听器
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((s) => Math.min(5, Math.max(0.25, s + delta)));
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      wrapper.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // 开始拖动 (右键)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) { // 右键拖动
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setScrollStart({ x: position.x, y: position.y });
    }
  }, [position]);

  // 禁用右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // 拖动中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPosition({
      x: scrollStart.x + dx,
      y: scrollStart.y + dy,
    });
  }, [isDragging, dragStart, scrollStart]);

  // 结束拖动
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 重置视图
  const resetView = useCallback(() => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}
            title="缩小"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-14 text-center font-mono">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale((s) => Math.min(5, s + 0.25))}
            title="放大"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={resetView}
            title="重置视图"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => { setCurrentPage((p) => p - 1); setPosition({ x: 0, y: 0 }); }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={currentPage >= totalPages}
            onClick={() => { setCurrentPage((p) => p + 1); setPosition({ x: 0, y: 0 }); }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <ThemeToggle />
        </div>
      </div>

      {/* PDF 渲染区域 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Skeleton className="w-full max-w-2xl h-150" />
        </div>
      ) : (
        <div
          ref={canvasWrapperRef}
          className={`overflow-hidden bg-muted/30 rounded-lg p-4 min-h-150 flex items-center justify-center ${isDragging ? "cursor-grabbing" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          <div
            ref={containerRef}
            className="inline-block"
          />
        </div>
      )}
    </div>
  );
}
