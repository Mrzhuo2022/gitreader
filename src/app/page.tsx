import Link from "next/link";
import { Book, Library, Upload, ArrowRight, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            简洁优雅的在线阅读体验
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            GitReader
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            一个类似 GitBook 的在线书籍阅读平台，支持 Markdown、EPUB、TXT、PDF 多种格式，
            每本书都有独立的 URL，简洁美观的阅读界面。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/library">
              <Button size="lg" className="gap-2">
                <Library className="h-5 w-5" />
                浏览书库
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/upload">
              <Button size="lg" variant="outline" className="gap-2">
                <Upload className="h-5 w-5" />
                上传书籍
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">核心特性</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  多格式支持
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  支持 Markdown、EPUB、PDF 多种书籍格式，自动解析目录结构，
                  提供流畅的阅读体验。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-primary" />
                  GitBook 风格
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  简洁的三栏布局设计，左侧目录导航、中央阅读区、右侧页面大纲，
                  支持明暗主题切换。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  轻松管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  拖拽上传书籍文件，自动提取元数据，每本书都有独立的 URL 地址，
                  方便分享和访问。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">开始使用</h2>
          <p className="text-muted-foreground mb-8">
            上传你的第一本书，开启优雅的在线阅读之旅
          </p>
          <Link href="/admin/upload">
            <Button size="lg">
              立即上传
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>GitReader - 优雅的在线阅读器</p>
          <p className="mt-1">
            Build with ❤️ by Evarle
          </p>
        </div>
      </footer>
    </div>
  );
}
