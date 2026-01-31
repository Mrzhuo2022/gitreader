# 📚 GitReader

一个基于 Next.js 构建的现代化在线电子书阅读器，支持多种格式，提供优雅的阅读体验。

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## ✨ 功能特性

### 📖 支持的格式
- **EPUB** - 完整解析章节、目录、元数据
- **TXT** - 智能章节分割，支持大文件
- **Markdown** - GFM 语法支持，代码高亮
- **PDF** - 基于 PDF.js 渲染

### 🎨 阅读体验
- 🌙 深色/浅色主题切换
- 📏 可调节字体大小和行高
- 📐 自适应内容宽度
- 📑 目录导航与章节跳转
- 🔖 书签功能，记录阅读位置
- 📊 阅读进度指示器
- ⬆️ 一键返回顶部

### 📚 书库管理
- 📤 拖拽上传书籍
- 🗂️ 书籍列表与分类
- 🔒 上传密码保护
- 🗑️ 书籍删除管理

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm / npm / yarn

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/your-username/gitreader.git
cd gitreader

# 安装依赖
pnpm install

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

### 环境变量

创建 `.env` 文件：

```env
# 上传密码（可选，留空则无需密码）
UPLOAD_PASSWORD=your_secret_password
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── books/         # 书籍 CRUD
│   │   ├── upload/        # 文件上传
│   │   └── auth/          # 认证验证
│   ├── admin/upload/      # 上传管理页
│   ├── books/[slug]/      # 阅读器页面
│   └── library/           # 书库页面
├── components/
│   ├── reader/            # 阅读器组件
│   ├── renderers/         # 格式渲染器
│   └── ui/                # UI 组件 (shadcn/ui)
├── lib/
│   ├── parsers/           # 文件解析器
│   └── db.ts              # 数据库连接
└── stores/                # Zustand 状态管理
```

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| 组件库 | shadcn/ui + Radix UI |
| 状态管理 | Zustand |
| 数据库 | Prisma + SQLite (better-sqlite3) |
| EPUB 解析 | epub.js + JSZip |
| PDF 渲染 | PDF.js |
| Markdown | unified + remark + rehype |
| 字体 | 霞鹜文楷屏幕阅读版 |

## 📝 开发命令

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务器
pnpm lint     # 代码检查
```

## 🗄️ 数据库

项目使用 Prisma + SQLite，数据库文件位于 `prisma/dev.db`。

```bash
# 生成 Prisma Client
npx prisma generate

# 数据库迁移
npx prisma db push

# 打开数据库管理界面
npx prisma studio
```

## 📄 License

MIT License

---

Made with ❤️ using Next.js
