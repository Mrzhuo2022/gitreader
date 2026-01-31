// 客户端文件读取工具（仅用于开发/演示）
export async function readFile(path: string): Promise<string> {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to read file: ${path}`);
    return await res.text();
  } catch (error) {
    console.error("Error reading file:", error);
    return "";
  }
}
