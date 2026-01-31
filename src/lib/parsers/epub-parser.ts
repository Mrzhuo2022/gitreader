import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

export interface EpubMetadata {
  title?: string;
  author?: string;
  description?: string;
  publisher?: string;
  language?: string;
  pubdate?: string;
  cover?: Buffer;
  coverMimeType?: string;
}

/**
 * 解析 EPUB 文件的元数据
 */
export async function parseEpubMetadata(buffer: Buffer): Promise<EpubMetadata> {
  const zip = await JSZip.loadAsync(buffer);
  const metadata: EpubMetadata = {};

  try {
    // 1. 读取 container.xml 找到 OPF 文件路径
    const containerXml = await zip.file("META-INF/container.xml")?.async("text");
    if (!containerXml) {
      throw new Error("Invalid EPUB: missing container.xml");
    }

    const container = await parseStringPromise(containerXml);
    const rootfilePath = container?.container?.rootfiles?.[0]?.rootfile?.[0]?.["$"]?.["full-path"];
    
    if (!rootfilePath) {
      throw new Error("Invalid EPUB: cannot find rootfile path");
    }

    // 2. 读取 OPF 文件（包含元数据）
    const opfXml = await zip.file(rootfilePath)?.async("text");
    if (!opfXml) {
      throw new Error("Invalid EPUB: cannot read OPF file");
    }

    const opf = await parseStringPromise(opfXml);
    const opfMetadata = opf?.package?.metadata?.[0];
    
    if (!opfMetadata) {
      return metadata;
    }

    // 3. 提取元数据
    // 标题
    const titleEl = opfMetadata["dc:title"]?.[0];
    metadata.title = typeof titleEl === "string" ? titleEl : titleEl?.["_"];

    // 作者
    const creatorEl = opfMetadata["dc:creator"]?.[0];
    metadata.author = typeof creatorEl === "string" ? creatorEl : creatorEl?.["_"];

    // 描述
    const descEl = opfMetadata["dc:description"]?.[0];
    metadata.description = typeof descEl === "string" ? descEl : descEl?.["_"];
    // 清理 HTML 标签
    if (metadata.description) {
      metadata.description = metadata.description
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // 出版社
    const publisherEl = opfMetadata["dc:publisher"]?.[0];
    metadata.publisher = typeof publisherEl === "string" ? publisherEl : publisherEl?.["_"];

    // 语言
    const langEl = opfMetadata["dc:language"]?.[0];
    metadata.language = typeof langEl === "string" ? langEl : langEl?.["_"];

    // 出版日期
    const dateEl = opfMetadata["dc:date"]?.[0];
    metadata.pubdate = typeof dateEl === "string" ? dateEl : dateEl?.["_"];

    // 4. 提取封面图片
    const coverData = await extractCover(zip, opf, rootfilePath);
    if (coverData) {
      metadata.cover = coverData.buffer;
      metadata.coverMimeType = coverData.mimeType;
    }

  } catch (error) {
    console.error("Error parsing EPUB metadata:", error);
  }

  return metadata;
}

/**
 * 提取封面图片
 */
async function extractCover(
  zip: JSZip,
  opf: Record<string, unknown>,
  opfPath: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const pkg = opf?.package as Record<string, unknown[]>;
    const manifestItems = pkg?.manifest?.[0] as { item?: Array<{ $: Record<string, string> }> };
    const metadataEl = pkg?.metadata?.[0] as Record<string, Array<{ $?: Record<string, string> }>>;
    
    // 方法1: 从 metadata 中的 meta 标签查找 cover
    let coverId: string | null = null;
    const metaElements = metadataEl?.meta;
    if (metaElements) {
      for (const meta of metaElements) {
        if (meta?.$?.name === "cover") {
          coverId = meta.$.content;
          break;
        }
      }
    }

    // 方法2: 从 manifest 中查找带有 cover-image 属性的项
    if (!coverId && manifestItems?.item) {
      for (const item of manifestItems.item) {
        const properties = item.$?.properties || "";
        if (properties.includes("cover-image")) {
          coverId = item.$.id;
          break;
        }
      }
    }

    // 方法3: 查找 id 包含 "cover" 的图片项
    if (!coverId && manifestItems?.item) {
      for (const item of manifestItems.item) {
        const id = item.$.id?.toLowerCase() || "";
        const mediaType = item.$?.["media-type"] || "";
        if (id.includes("cover") && mediaType.startsWith("image/")) {
          coverId = item.$.id;
          break;
        }
      }
    }

    if (!coverId || !manifestItems?.item) {
      return null;
    }

    // 根据 id 找到 manifest 项
    let coverItem: { $: Record<string, string> } | null = null;
    for (const item of manifestItems.item) {
      if (item.$.id === coverId) {
        coverItem = item;
        break;
      }
    }

    if (!coverItem) {
      return null;
    }

    // 解析封面图片路径
    const href = coverItem.$?.href;
    const mediaType = coverItem.$?.["media-type"];
    
    if (!href || !mediaType?.startsWith("image/")) {
      return null;
    }

    // 计算完整路径（相对于 OPF 文件）
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);
    const coverPath = opfDir ? opfDir + href : href;

    // 读取图片
    const coverFile = zip.file(coverPath) || zip.file(decodeURIComponent(coverPath));
    if (!coverFile) {
      return null;
    }

    const buffer = await coverFile.async("nodebuffer");
    return { buffer, mimeType: mediaType };

  } catch (error) {
    console.error("Error extracting cover:", error);
    return null;
  }
}
