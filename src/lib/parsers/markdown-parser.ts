import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface HastNode {
  type?: string;
  tagName?: string;
  properties?: { id?: string };
  children?: HastNode[];
  value?: string;
}

export async function parseMarkdown(content: string): Promise<{
  html: string;
  headings: TocHeading[];
}> {
  const headings: TocHeading[] = [];

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(() => (tree: unknown) => {
      // 提取标题用于目录
      const visit = (node: HastNode) => {
        const tagName = node.tagName;
        if (node.type === "element" && tagName && ["h1", "h2", "h3"].includes(tagName)) {
          const id = node.properties?.id;
          const text = extractText(node);
          if (id && text) {
            const level = parseInt(tagName.charAt(1), 10);
            headings.push({
              id,
              text,
              level,
            });
          }
        }
        if (node.children) {
          node.children.forEach(visit);
        }
      };
      visit(tree as HastNode);
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return {
    html: String(result),
    headings,
  };
}

function extractText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  if (node.children) {
    return node.children.map(extractText).join("");
  }
  return "";
}

// 从 Markdown 文件中提取 frontmatter 和内容
export function parseFrontmatter(content: string): {
  metadata: Record<string, string>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const metadata: Record<string, string> = {};
  const frontmatter = match[1];
  frontmatter.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(":").trim().replace(/^["']|["']$/g, "");
    }
  });

  return {
    metadata,
    content: content.slice(match[0].length),
  };
}
