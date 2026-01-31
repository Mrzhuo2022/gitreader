import { create } from "zustand";
import { persist } from "zustand/middleware";

// 可选的字体列表
export const FONT_OPTIONS = [
  { value: "lxgw", label: "霞鹜文楷", family: "'LXGW WenKai Screen', 'KaiTi', serif" },
  { value: "serif", label: "衬线体", family: "Georgia, 'Noto Serif SC', 'Source Han Serif SC', serif" },
  { value: "sans", label: "无衬线", family: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" },
  { value: "kai", label: "楷体", family: "'KaiTi', 'STKaiti', 'AR PL UKai CN', serif" },
  { value: "song", label: "宋体", family: "'SimSun', 'STSong', 'AR PL UMing CN', serif" },
  { value: "hei", label: "黑体", family: "'SimHei', 'STHeiti', 'Noto Sans SC', sans-serif" },
  { value: "fangsong", label: "仿宋", family: "'FangSong', 'STFangsong', serif" },
  { value: "system", label: "系统默认", family: "system-ui, -apple-system, sans-serif" },
] as const;

export type FontOption = typeof FONT_OPTIONS[number]["value"];

interface ReaderState {
  // 侧边栏状态
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // 阅读进度
  currentChapter: string | null;
  setCurrentChapter: (chapter: string | null) => void;

  // 字体大小
  fontSize: number;
  setFontSize: (size: number) => void;

  // 字体选择
  fontFamily: FontOption;
  setFontFamily: (font: FontOption) => void;

  // 行高
  lineHeight: number;
  setLineHeight: (height: number) => void;

  // 阅读宽度
  contentWidth: "narrow" | "normal" | "wide";
  setContentWidth: (width: "narrow" | "normal" | "wide") => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      currentChapter: null,
      setCurrentChapter: (chapter) => set({ currentChapter: chapter }),

      fontSize: 16,
      setFontSize: (size) => set({ fontSize: size }),

      fontFamily: "lxgw",
      setFontFamily: (font) => set({ fontFamily: font }),

      lineHeight: 1.75,
      setLineHeight: (height) => set({ lineHeight: height }),

      contentWidth: "normal",
      setContentWidth: (width) => set({ contentWidth: width }),
    }),
    {
      name: "reader-settings",
    }
  )
);
