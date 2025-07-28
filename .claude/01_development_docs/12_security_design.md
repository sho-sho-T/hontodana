# セキュリティ設計書

## 1. セキュリティ全体戦略

### 1.1 セキュリティ原則
- **最小権限の原則**: 必要最小限の権限のみ付与
- **深層防御**: 複数のセキュリティ層で保護
- **ゼロトラスト**: すべてのリクエストを検証
- **プライバシーバイデザイン**: ユーザーデータの保護を優先

### 1.2 脅威モデル分析
- **悪意あるユーザー**: 不正アクセス、データ改ざん
- **データ漏洩**: 個人情報、読書情報の不正取得
- **サービス停止攻撃**: DDoS、システム負荷攻撃
- **インジェクション攻撃**: SQLインジェクション、XSS、CSRF

## 2. 認証・認可設計

### 2.1 Supabase Auth統合
```typescript
// lib/auth/supabase-auth.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // PKCEでセキュリティ強化
  },
  global: {
    headers: {
      'X-Client-Info': 'hontodana-web',
    },
  },
});

// ユーザー情報取得
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new AuthenticationError('ユーザー情報の取得に失敗しました', error.message);
  }
  
  return user;
}

// ログイン
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new AuthenticationError('ログインに失敗しました', error.message);
  }
  
  // ログインログ記録
  await logSecurityEvent('LOGIN_SUCCESS', {
    userId: data.user.id,
    ipAddress: await getClientIP(),
    userAgent: navigator.userAgent,
  });
  
  return data;
}

// Google OAuthログイン
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) {
    throw new AuthenticationError('Googleログインに失敗しました', error.message);
  }
  
  return data;
}
```

### 2.2 パスワードポリシー
```typescript
// lib/auth/password-policy.ts
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true, // ユーザー名、メールの使用禁止
};

export function validatePassword(password: string, userInfo?: { email?: string; username?: string }): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 長さチェック
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`パスワードは${PASSWORD_POLICY.minLength}文字以上で入力してください`);
  }
  
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`パスワードは${PASSWORD_POLICY.maxLength}文字以内で入力してください`);
  }
  
  // 文字種チェック
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('大文字を含めてください');
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('小文字を含めてください');
  }
  
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('数字を含めてください');
  }
  
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('特殊文字を含めてください');
  }
  
  // 一般的なパスワードチェック
  if (PASSWORD_POLICY.preventCommonPasswords && isCommonPassword(password)) {
    errors.push('よく使われるパスワードは使用できません');
  }
  
  // ユーザー情報が含まれていないかチェック
  if (PASSWORD_POLICY.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    if (userInfo.email && lowerPassword.includes(userInfo.email.split('@')[0].toLowerCase())) {
      errors.push('メールアドレスの一部をパスワードに使用できません');
    }
    if (userInfo.username && lowerPassword.includes(userInfo.username.toLowerCase())) {
      errors.push('ユーザー名をパスワードに使用できません');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
  ];
  
  return commonPasswords.includes(password.toLowerCase());
}
```

### 2.3 セッション管理
```typescript
// lib/auth/session-manager.ts
interface SessionConfig {
  maxAge: number; // セッション有効期限（秒）
  maxIdleTime: number; // アイドルタイムアウト（秒）
  requireHttps: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

const SESSION_CONFIG: SessionConfig = {
  maxAge: 24 * 60 * 60, // 24時間
  maxIdleTime: 2 * 60 * 60, // 2時間
  requireHttps: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export class SessionManager {
  private lastActivity: number = Date.now();
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startSessionMonitoring();
  }
  
  private startSessionMonitoring() {
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity();
    }, 60000); // 1分ごとにチェック
  }
  
  private async checkSessionValidity() {
    const now = Date.now();
    const idleTime = (now - this.lastActivity) / 1000;
    
    if (idleTime > SESSION_CONFIG.maxIdleTime) {
      await this.expireSession('アイドルタイムアウト');
    }
  }
  
  public updateActivity() {
    this.lastActivity = Date.now();
  }
  
  private async expireSession(reason: string) {
    await logSecurityEvent('SESSION_EXPIRED', {
      reason,
      lastActivity: new Date(this.lastActivity).toISOString(),
    });
    
    await supabase.auth.signOut();
    window.location.href = '/auth/login?reason=session_expired';
  }
  
  public destroy() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }
}
```

## 3. データ保護設計

### 3.1 Row Level Security (RLS)
```sql
-- usersテーブルのRLSポリシー
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみ閲覧可能
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 公開プロフィールの閲覧を許可
CREATE POLICY "users_select_public" ON users
  FOR SELECT USING (
    (privacy_settings->>'profile_public')::boolean = true
  );

-- booksテーブルのRLSポリシー
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の書籍のみ操作可能
CREATE POLICY "books_full_access_own" ON books
  FOR ALL USING (auth.uid() = user_id);

-- reading_recordsテーブルのRLSポリシー
ALTER TABLE reading_records ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の読書記録のみ操作可能
CREATE POLICY "reading_records_full_access_own" ON reading_records
  FOR ALL USING (auth.uid() = user_id);

-- 公開設定の読書記録は他ユーザーも閲覧可能
CREATE POLICY "reading_records_select_public" ON reading_records
  FOR SELECT USING (
    is_public = true AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = reading_records.user_id 
      AND (users.privacy_settings->>'reading_records_public')::boolean = true
    )
  );
```

### 3.2 データ暗号化
```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(12); // GCM推奨IV長
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('hontodana-data', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // IV + AuthTag + 暗号化データを結合
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('暗号化に失敗しました');
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('無効な暗号化データ形式');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('hontodana-data', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('復号化に失敗しました');
  }
}

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}
```

### 3.3 機密情報マスキング
```typescript
// lib/security/data-masking.ts
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.slice(0, 2)}***@${domain}`;
}

export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';
  return cleaned.slice(0, 3) + '***' + cleaned.slice(-4);
}

export function sanitizeUserData(user: any) {
  return {
    ...user,
    email: maskEmail(user.email),
    phone: user.phone ? maskPhoneNumber(user.phone) : undefined,
    // 機密フィールドを除去
    password: undefined,
    auth_token: undefined,
    reset_token: undefined,
  };
}
```

## 4. 入力値検証設計

### 4.1 Zodスキーマ検証
```typescript
// lib/validations/security.ts
import { z } from 'zod';

// XSS攻撃対策のサニタイズ関数
function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// SQLインジェクション対策のパターンチェック
const SQL_INJECTION_PATTERNS = [
  /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
  /(exec|execute|select|insert|update|delete|create|alter|drop|truncate)/i,
  /(script|javascript|vbscript|onload|onerror|onclick)/i,
];

function containsSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// セキュアテキストバリデーション
const secureText = z.string()
  .min(1, '入力は必須です')
  .max(1000, '入力が長すぎます')
  .refine(
    (val) => !containsSqlInjection(val),
    '不正な文字が含まれています'
  )
  .transform(sanitizeHtml);

// 書籍登録フォームのセキュアバリデーション
export const secureBookSchema = z.object({
  title: secureText.max(200, 'タイトルは200文字以内で入力してください'),
  author: secureText.max(100, '著者名は100文字以内で入力してください'),
  isbn: z.string()
    .regex(/^(?:\d{10}|\d{13})$/, 'ISBNは10桁または13桁の数字で入力してください')
    .optional(),
  description: secureText.max(1000, '説明は1000文字以内で入力してください').optional(),
  pageCount: z.number()
    .min(1, 'ページ数は1以上で入力してください')
    .max(10000, 'ページ数が上限を超えています')
    .optional(),
});

// ユーザー登録フォームのセキュアバリデーション
export const secureUserSchema = z.object({
  email: z.string()
    .email('有効なメールアドレスを入力してください')
    .min(5, 'メールアドレスが短すぎます')
    .max(254, 'メールアドレスが長すぎます'), // RFC 5321の上限
  username: z.string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(20, 'ユーザー名は20文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ユーザー名に使用できるのは英数字、アンダースコア、ハイフンのみです'),
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(128, 'パスワードは128文字以内で入力してください'),
});
```

### 4.2 レートリミット設計
```typescript
// lib/security/rate-limiter.ts
import { Redis } from 'ioredis';

interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  message: string; // 制限時のメッセージ
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 5, // 5回まで
    message: 'ログイン試行回数が上限を超えました。15分後に再度お試しください。',
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1時間
    maxRequests: 3, // 3回まで
    message: 'アカウント作成試行回数が上限を超えました。',
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 100, // 100回まで
    message: 'APIリクエストが限度を超えました。',
  },
};

export class RateLimiter {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  async checkRateLimit(
    identifier: string, // IPアドレスまたはユーザーID
    action: keyof typeof RATE_LIMITS
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = RATE_LIMITS[action];
    const key = `rate_limit:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // 古いエントリを削除
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // 現在のリクエスト数を取得
    const currentRequests = await this.redis.zcard(key);
    
    if (currentRequests >= config.maxRequests) {
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest.length > 0 
        ? parseInt(oldestRequest[1]) + config.windowMs
        : now + config.windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }
    
    // リクエストを記録
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, Math.ceil(config.windowMs / 1000));
    
    return {
      allowed: true,
      remaining: config.maxRequests - currentRequests - 1,
      resetTime: now + config.windowMs,
    };
  }
}

// Next.js APIミドルウェア
export function withRateLimit(action: keyof typeof RATE_LIMITS) {
  return async (req: NextRequest, context: any, next: () => Promise<Response>) => {
    const rateLimiter = new RateLimiter();
    const identifier = getClientIP(req) || 'anonymous';
    
    const result = await rateLimiter.checkRateLimit(identifier, action);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: RATE_LIMITS[action].message,
          resetTime: result.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    const response = await next();
    
    // レートリミット情報をレスポンスヘッダーに追加
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS[action].maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
}
```

## 5. CSRF攻撃対策

### 5.1 CSRFトークン管理
```typescript
// lib/security/csrf.ts
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1時間

interface CSRFTokenData {
  token: string;
  timestamp: number;
  sessionId: string;
}

export class CSRFProtection {
  private tokenStore = new Map<string, CSRFTokenData>();
  
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
    const timestamp = Date.now();
    
    this.tokenStore.set(token, {
      token,
      timestamp,
      sessionId,
    });
    
    // 期限切れトークンのクリーンアップ
    this.cleanExpiredTokens();
    
    return token;
  }
  
  validateToken(token: string, sessionId: string): boolean {
    const tokenData = this.tokenStore.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    // 期限チェック
    if (Date.now() - tokenData.timestamp > CSRF_TOKEN_EXPIRY) {
      this.tokenStore.delete(token);
      return false;
    }
    
    // セッションIDチェック
    if (tokenData.sessionId !== sessionId) {
      return false;
    }
    
    // 使用後はトークンを削除（ワンタイムトークン）
    this.tokenStore.delete(token);
    
    return true;
  }
  
  private cleanExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.tokenStore.entries()) {
      if (now - data.timestamp > CSRF_TOKEN_EXPIRY) {
        this.tokenStore.delete(token);
      }
    }
  }
}

// Next.js APIミドルウェア
export function withCSRFProtection() {
  const csrfProtection = new CSRFProtection();
  
  return async (req: NextRequest, context: any, next: () => Promise<Response>) => {
    const method = req.method;
    
    // GETリクエストはチェックしない
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next();
    }
    
    const sessionId = getSessionId(req);
    const csrfToken = req.headers.get('X-CSRF-Token') || 
                     req.headers.get('csrf-token');
    
    if (!csrfToken || !csrfProtection.validateToken(csrfToken, sessionId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return next();
  };
}
```

## 6. セキュリティヘッダー設定

### 6.1 Next.jsセキュリティヘッダー
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', ')
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 6.2 ミドルウェア統合
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from './lib/security/rate-limiter';
import { withCSRFProtection } from './lib/security/csrf';
import { logSecurityEvent } from './lib/security/audit-log';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // APIルートのセキュリティチェック
  if (pathname.startsWith('/api/')) {
    // レートリミット適用
    const rateLimitResult = await withRateLimit('api')(request);
    if (rateLimitResult.status === 429) {
      await logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        path: pathname,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
      });
      return rateLimitResult;
    }
    
    // CSRF保護適用
    const csrfResult = await withCSRFProtection()(request);
    if (csrfResult.status === 403) {
      await logSecurityEvent('CSRF_TOKEN_INVALID', {
        path: pathname,
        ip: getClientIP(request),
      });
      return csrfResult;
    }
  }
  
  // 認証が必要なページのチェック
  const protectedPaths = ['/dashboard', '/books', '/profile', '/social'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    const token = request.cookies.get('sb-access-token')?.value;
    
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // トークンの有効性を簡易チェック
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/books/:path*',
    '/profile/:path*',
    '/social/:path*',
  ],
};
```

## 7. セキュリティ監視・ログ

### 7.1 セキュリティイベントログ
```typescript
// lib/security/audit-log.ts
interface SecurityEvent {
  id: string;
  eventType: string;
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

const SECURITY_EVENT_TYPES = {
  LOGIN_SUCCESS: { severity: 'LOW' as const },
  LOGIN_FAILURE: { severity: 'MEDIUM' as const },
  LOGIN_LOCKED: { severity: 'HIGH' as const },
  PASSWORD_CHANGE: { severity: 'MEDIUM' as const },
  UNAUTHORIZED_ACCESS: { severity: 'HIGH' as const },
  RATE_LIMIT_EXCEEDED: { severity: 'MEDIUM' as const },
  CSRF_TOKEN_INVALID: { severity: 'HIGH' as const },
  SUSPICIOUS_ACTIVITY: { severity: 'CRITICAL' as const },
  DATA_EXPORT: { severity: 'MEDIUM' as const },
  ADMIN_ACTION: { severity: 'HIGH' as const },
};

export async function logSecurityEvent(
  eventType: keyof typeof SECURITY_EVENT_TYPES,
  metadata: Partial<SecurityEvent> = {}
) {
  const event: SecurityEvent = {
    id: crypto.randomUUID(),
    eventType,
    timestamp: new Date(),
    ipAddress: metadata.ipAddress || 'unknown',
    result: metadata.result || 'SUCCESS',
    severity: SECURITY_EVENT_TYPES[eventType].severity,
    ...metadata,
  };
  
  // データベースに記録
  await supabase.from('security_logs').insert(event);
  
  // 重大なイベントは即座通知
  if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
    await sendSecurityAlert(event);
  }
  
  // コンソールログ出力
  console.log(`[SECURITY] ${eventType}:`, event);
}

async function sendSecurityAlert(event: SecurityEvent) {
  // Slack通知、メール通知など
  if (process.env.SLACK_SECURITY_WEBHOOK) {
    await fetch(process.env.SLACK_SECURITY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `セキュリティアラート: ${event.eventType}`,
        attachments: [{
          color: event.severity === 'CRITICAL' ? 'danger' : 'warning',
          fields: [
            { title: 'イベント', value: event.eventType, short: true },
            { title: '深刻度', value: event.severity, short: true },
            { title: 'IPアドレス', value: event.ipAddress, short: true },
            { title: '時刻', value: event.timestamp.toISOString(), short: true },
          ],
        }],
      }),
    });
  }
}
```

### 7.2 異常検出システム
```typescript
// lib/security/anomaly-detection.ts
interface UserBehavior {
  userId: string;
  ipAddress: string;
  location?: string;
  deviceFingerprint: string;
  loginTimes: Date[];
  actions: string[];
}

export class AnomalyDetector {
  async detectAnomalies(userId: string, currentBehavior: Partial<UserBehavior>): Promise<{
    isAnomalous: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;
    
    // 過去の行動パターンを取得
    const pastBehavior = await this.getUserBehaviorHistory(userId);
    
    // IPアドレスの異常チェック
    if (currentBehavior.ipAddress && !pastBehavior.knownIPs.includes(currentBehavior.ipAddress)) {
      const ipInfo = await this.getIPInfo(currentBehavior.ipAddress);
      if (ipInfo.isVPN || ipInfo.isTor || ipInfo.country !== pastBehavior.usualCountry) {
        reasons.push('新しいIPアドレスまたは異常な地域からのアクセス');
        riskScore += 30;
      }
    }
    
    // ログイン時間の異常チェック
    const currentHour = new Date().getHours();
    if (!pastBehavior.usualLoginHours.includes(currentHour)) {
      reasons.push('通常と異なる時間帯のログイン');
      riskScore += 15;
    }
    
    // デバイスフィンガープリントの異常チェック
    if (currentBehavior.deviceFingerprint && 
        !pastBehavior.knownDevices.includes(currentBehavior.deviceFingerprint)) {
      reasons.push('新しいデバイスからのアクセス');
      riskScore += 20;
    }
    
    // 連続ログイン失敗のチェック
    const recentFailedLogins = await this.getRecentFailedLogins(userId, currentBehavior.ipAddress!);
    if (recentFailedLogins >= 3) {
      reasons.push('最近のログイン失敗回数が多い');
      riskScore += 40;
    }
    
    return {
      isAnomalous: riskScore >= 50,
      riskScore,
      reasons,
    };
  }
  
  private async getUserBehaviorHistory(userId: string) {
    // ユーザーの過去の行動パターンを分析
    // 実装は略
    return {
      knownIPs: [],
      knownDevices: [],
      usualCountry: 'JP',
      usualLoginHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    };
  }
}
```

この包括的なセキュリティ設計により、ユーザーデータとアプリケーションを安全に保護できます。