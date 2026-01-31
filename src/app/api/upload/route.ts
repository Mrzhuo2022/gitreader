import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { parseEpubMetadata } from "@/lib/parsers/epub-parser";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// 确保上传目录存在
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// 验证上传密码
function verifyPassword(password: string | null): boolean {
  const uploadPassword = process.env.UPLOAD_PASSWORD;
  
  // 如果没有设置密码，允许所有上传（开发模式）
  if (!uploadPassword) {
    return true;
  }
  
  return password === uploadPassword;
}

// POST /api/upload - 上传文件
export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    
    // 验证密码
    const password = formData.get("password") as string | null;
    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "密码错误，无权上传" },
        { status: 401 }
      );
    }
    
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "没有上传文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedExtensions = [".pdf", ".epub", ".md", ".markdown", ".txt", ".jpg", ".jpeg", ".png", ".gif", ".webp"];

    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `不支持的文件格式: ${ext}` },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/[^a-zA-Z0-9.\-_\u4e00-\u9fa5]/g, "_")
      .substring(0, 100);
    const filename = `${timestamp}-${safeName}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 写入文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 返回公开 URL
    const publicUrl = `/uploads/${filename}`;

    // 根据扩展名确定格式
    let format: string;
    switch (ext) {
      case ".pdf":
        format = "pdf";
        break;
      case ".epub":
        format = "epub";
        break;
      case ".md":
      case ".markdown":
        format = "markdown";
        break;
      case ".txt":
        format = "txt";
        break;
      case ".jpg":
      case ".jpeg":
      case ".png":
      case ".gif":
      case ".webp":
        format = "image";
        break;
      default:
        format = "unknown";
    }

    // 如果是 EPUB，解析元数据
    let metadata: {
      title?: string;
      author?: string;
      description?: string;
      coverUrl?: string;
    } = {};

    if (format === "epub") {
      try {
        const epubMeta = await parseEpubMetadata(buffer);
        metadata = {
          title: epubMeta.title,
          author: epubMeta.author,
          description: epubMeta.description,
        };

        // 保存封面图片
        if (epubMeta.cover && epubMeta.coverMimeType) {
          const coverExt = epubMeta.coverMimeType.split("/")[1] || "jpg";
          const coverFilename = `${timestamp}-cover.${coverExt}`;
          const coverPath = path.join(UPLOAD_DIR, coverFilename);
          await writeFile(coverPath, epubMeta.cover);
          metadata.coverUrl = `/uploads/${coverFilename}`;
        }
      } catch (err) {
        console.error("Failed to parse EPUB metadata:", err);
      }
    }

    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl,
      format,
      size: file.size,
      metadata,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "文件上传失败" },
      { status: 500 }
    );
  }
}
