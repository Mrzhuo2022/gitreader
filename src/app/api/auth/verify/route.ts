import { NextRequest, NextResponse } from "next/server";

// 简单的内存存储登录尝试记录（生产环境可用 Redis）
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();

// 配置
const MAX_ATTEMPTS = 5; // 最大尝试次数
const LOCK_TIME = 15 * 60 * 1000; // 锁定时间：15分钟
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 尝试窗口：5分钟内的尝试计数

// 获取客户端 IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || "unknown";
}

// 检查是否被锁定
function isLocked(ip: string): { locked: boolean; remainingTime?: number } {
  const record = loginAttempts.get(ip);
  if (!record) return { locked: false };
  
  const now = Date.now();
  if (record.lockedUntil > now) {
    return { 
      locked: true, 
      remainingTime: Math.ceil((record.lockedUntil - now) / 1000 / 60) // 剩余分钟数
    };
  }
  
  // 锁定已过期，清除记录
  if (record.lockedUntil > 0) {
    loginAttempts.delete(ip);
  }
  
  return { locked: false };
}

// 记录失败尝试
function recordFailedAttempt(ip: string): { locked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  
  if (!record || (now - record.lastAttempt) > ATTEMPT_WINDOW) {
    // 新记录或超出窗口，重置计数
    loginAttempts.set(ip, { count: 1, lastAttempt: now, lockedUntil: 0 });
    return { locked: false, attemptsLeft: MAX_ATTEMPTS - 1 };
  }
  
  record.count++;
  record.lastAttempt = now;
  
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_TIME;
    return { locked: true, attemptsLeft: 0 };
  }
  
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - record.count };
}

// 清除成功登录的记录
function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// POST /api/auth/verify - 验证上传密码
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // 检查是否被锁定
    const lockStatus = isLocked(clientIP);
    if (lockStatus.locked) {
      return NextResponse.json(
        { 
          valid: false, 
          error: `尝试次数过多，请 ${lockStatus.remainingTime} 分钟后重试`,
          locked: true 
        },
        { status: 429 }
      );
    }
    
    const { password } = await request.json();
    
    const uploadPassword = process.env.UPLOAD_PASSWORD;
    
    if (!uploadPassword) {
      // 如果没有设置密码，允许所有上传（开发模式）
      return NextResponse.json({ valid: true, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    }
    
    if (password === uploadPassword) {
      clearAttempts(clientIP);
      // 返回过期时间（24小时后）
      return NextResponse.json({ 
        valid: true, 
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 
      });
    }
    
    // 记录失败尝试
    const attemptResult = recordFailedAttempt(clientIP);
    
    if (attemptResult.locked) {
      return NextResponse.json(
        { 
          valid: false, 
          error: `尝试次数过多，请 15 分钟后重试`,
          locked: true 
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        valid: false, 
        error: `密码错误，还剩 ${attemptResult.attemptsLeft} 次尝试机会` 
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: "验证失败" },
      { status: 500 }
    );
  }
}
