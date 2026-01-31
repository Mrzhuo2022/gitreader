import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

// 数据库文件路径
const dbPath = path.resolve("./prisma/dev.db");

// 创建 Prisma adapter
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 使用 adapter 初始化 PrismaClient
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
