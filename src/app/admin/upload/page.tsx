"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Loader2, ImagePlus, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 上传进度 0-100
  const [uploadStatus, setUploadStatus] = useState(""); // 上传状态文字
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // 密码验证状态
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 表单状态
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");

  // 从 localStorage 恢复认证状态
  useEffect(() => {
    const savedPassword = localStorage.getItem("upload_password");
    const expiresAt = localStorage.getItem("upload_auth_expires");
    
    // 检查是否过期
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      // Session 已过期，清除保存的凭据
      localStorage.removeItem("upload_password");
      localStorage.removeItem("upload_auth_expires");
      return;
    }
    
    if (savedPassword) {
      setPassword(savedPassword);
      // 静默验证保存的密码
      verifyPassword(savedPassword, true);
    }
  }, []);

  // 验证密码
  const verifyPassword = async (pwd: string, silent = false) => {
    if (!silent) setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await response.json();
      if (data.valid) {
        setIsAuthenticated(true);
        localStorage.setItem("upload_password", pwd);
        // 保存过期时间
        if (data.expiresAt) {
          localStorage.setItem("upload_auth_expires", data.expiresAt.toString());
        }
        setError(null);
      } else {
        if (!silent) {
          setError(data.error || "密码错误");
        }
        // 如果被锁定或密码错误，清除保存的凭据
        if (data.locked || !silent) {
          localStorage.removeItem("upload_password");
          localStorage.removeItem("upload_auth_expires");
        }
      }
    } catch {
      if (!silent) setError("验证失败");
    } finally {
      if (!silent) setIsVerifying(false);
    }
  };

  // 处理密码提交
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      verifyPassword(password);
    }
  };

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "未知错误";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // 处理封面选择
  const handleCoverSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    setCoverFile(selectedFile);
    // 创建预览 URL
    const url = URL.createObjectURL(selectedFile);
    setCoverPreview(url);
  }, []);

  // 为 EPUB 提取元数据（在前端解析，不上传文件）
  // 辅助函数：安全获取元数据值（处理数组或字符串）
  const getMetadataValue = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length > 0) {
      return typeof value[0] === "string" ? value[0] : String(value[0]);
    }
    return String(value);
  };

  const extractEpubMetadata = useCallback(async (selectedFile: File) => {
    setIsExtracting(true);
    try {
      // 在前端简单解析 EPUB 文件获取元数据预览
      // 使用 epubjs 在前端解析（仅用于预览）
      const { default: ePub } = await import("epubjs");
      const arrayBuffer = await selectedFile.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = (ePub as any)(arrayBuffer);
      await book.ready;
      
      // 获取元数据 - epubjs 的元数据结构
      const metadata = book.package?.metadata;
      console.log("EPUB metadata:", metadata);
      
      if (metadata) {
        // 标题 - 可能是字符串或数组
        const bookTitle = getMetadataValue(metadata.title);
        if (bookTitle && !title) {
          setTitle(bookTitle);
        }
        
        // 作者 - epubjs 可能用 creator 或 author，可能是字符串或数组
        const bookAuthor = getMetadataValue(metadata.creator) || getMetadataValue(metadata.author);
        if (bookAuthor && !author) {
          setAuthor(bookAuthor);
        }
        
        // 描述 - 可能是字符串或数组
        const bookDesc = getMetadataValue(metadata.description);
        if (bookDesc && !description) {
          // 清理 HTML 标签
          const cleanDesc = bookDesc
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim();
          setDescription(cleanDesc);
        }
      }

      // 尝试获取封面预览
      try {
        const epubCoverUrl = await book.coverUrl();
        if (epubCoverUrl && !coverPreview) {
          setCoverPreview(epubCoverUrl);
        }
      } catch {
        // 封面获取失败，忽略
      }

      book.destroy();
    } catch (err) {
      console.error("Failed to extract EPUB metadata:", err);
    } finally {
      setIsExtracting(false);
    }
  }, [title, author, description, coverPreview]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["pdf", "epub", "md", "markdown", "txt"];
    if (!ext || !allowedExts.includes(ext)) {
      setError(`不支持的文件格式: .${ext}`);
      return;
    }
    setError(null);
    setFile(selectedFile);

    // 自动填充标题（从文件名）
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
    if (!title) setTitle(nameWithoutExt);
    
    // 自动生成 slug - 使用时间戳确保唯一性，避免中文 URL 问题
    if (!slug) {
      const timestamp = Date.now().toString(36);
      const sanitized = nameWithoutExt
        .toLowerCase()
        .replace(/[\u4e00-\u9fa5]/g, "") // 移除中文字符
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 30);
      setSlug(sanitized ? `${sanitized}-${timestamp}` : timestamp);
    }

    // 如果是 EPUB，提取元数据
    if (ext === "epub") {
      await extractEpubMetadata(selectedFile);
    }
  }, [slug, title, extractEpubMetadata]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  // 带进度的上传函数
  const uploadWithProgress = useCallback((formData: FormData, onProgress: (percent: number) => void): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || `上传失败: ${xhr.status}`));
          } catch {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        }
      });
      
      xhr.addEventListener("error", () => reject(new Error("网络错误")));
      xhr.addEventListener("abort", () => reject(new Error("上传已取消")));
      
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !slug) {
      setError("请填写所有必填字段");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("正在上传文件...");
    setError(null);

    try {
      // 1. 上传文件（带进度）
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uploadData = await uploadWithProgress(formData, (percent) => {
        setUploadProgress(percent);
        if (percent < 100) {
          setUploadStatus(`正在上传文件... ${percent}%`);
        } else {
          setUploadStatus("正在处理文件...");
        }
      }) as any;

      setUploadStatus("正在创建书籍记录...");
      setUploadProgress(100);

      // 2. 如果用户上传了自定义封面，上传封面
      let finalCoverUrl = uploadData.metadata?.coverUrl || null;
      if (coverFile) {
        setUploadStatus("正在上传封面...");
        const coverFormData = new FormData();
        coverFormData.append("file", coverFile);
        coverFormData.append("password", password);
        
        const coverRes = await fetch("/api/upload", {
          method: "POST",
          body: coverFormData,
        });
        
        if (coverRes.ok) {
          const coverData = await coverRes.json();
          finalCoverUrl = coverData.url;
        }
      }

      // 3. 创建书籍记录
      setUploadStatus("正在保存书籍信息...");
      const bookRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author: author || null,
          description: description || null,
          slug,
          format: uploadData.format,
          filePath: uploadData.url,
          cover: finalCoverUrl,
        }),
      });

      if (!bookRes.ok) {
        const data = await bookRes.json();
        throw new Error(data.error || "创建书籍失败");
      }

      // 成功，跳转到书籍页面
      router.push(`/books/${slug}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto py-8 px-4">
        {/* 密码验证界面 */}
        {!isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                管理员验证
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  上传功能需要管理员密码验证
                </p>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={!password || isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      验证中...
                    </>
                  ) : "验证"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传新书籍
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 文件上传区域 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                  ${file ? "bg-muted/50" : "hover:border-primary/50"}
                `}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.epub,.md,.markdown,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">拖拽文件到此处或点击选择</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      支持格式：PDF、EPUB、Markdown、TXT
                    </p>
                  </>
                )}
              </div>

              {/* 正在提取元数据提示 */}
              {isExtracting && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在解析 EPUB 元数据...
                </div>
              )}

              {/* 封面上传区域 */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  封面图片
                </label>
                <div className="flex items-start gap-4">
                  {/* 封面预览 */}
                  <div
                    className={`
                      w-28 h-40 border-2 border-dashed rounded-lg flex items-center justify-center
                      cursor-pointer transition-colors hover:border-primary/50
                      ${coverPreview ? "border-transparent" : "border-muted-foreground/25"}
                    `}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCoverSelect(f);
                      }}
                    />
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="封面预览"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">点击上传</p>
                      </div>
                    )}
                  </div>
                  {/* 封面说明 */}
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p>可选：上传自定义封面图片</p>
                    <p className="mt-1">EPUB 文件会自动提取封面</p>
                    {coverPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreview(null);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        移除封面
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 书籍信息表单 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    书名 <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入书籍标题"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    URL 标识 <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">/books/</span>
                    <Input
                      value={slug}
                      onChange={(e) =>
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "-")
                        )
                      }
                      placeholder="my-book"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">作者</label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="输入作者名"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">简介</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="输入书籍简介..."
                    className="w-full min-h-25 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">
                  {error}
                </div>
              )}

              {/* 上传进度显示 */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{uploadStatus}</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isUploading || !file}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    上传书籍
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* 支持格式说明 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">支持的格式</p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">PDF</Badge>
            <Badge variant="secondary">EPUB</Badge>
            <Badge variant="secondary">Markdown</Badge>
            <Badge variant="secondary">TXT</Badge>
          </div>
        </div>
      </main>
    </div>
  );
}
