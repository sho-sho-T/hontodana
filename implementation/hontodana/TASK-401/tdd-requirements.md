# TASK-401: セキュリティ強化 - 詳細要件定義

## 概要

Hontodanaアプリケーションの包括的なセキュリティ強化を実施し、OWASP Top 10の脅威に対する防護を実装する。

## 要件リンク

- **NFR-102**: セキュリティ要件 - 認証・認可
- **NFR-103**: セキュリティ要件 - データ保護  
- **REQ-403**: セキュリティ関連機能要件

## 依存タスク

- **TASK-003**: Supabase Auth設定 ✅ (認証基盤)

## セキュリティ脅威分析

### OWASP Top 10 (2021) 対応状況

| 脅威 | 脅威名 | リスクレベル | 対策状況 | 実装予定 |
|-----|--------|------------|----------|----------|
| A01 | Broken Access Control | 高 | 一部対応 | ✅ 強化予定 |
| A02 | Cryptographic Failures | 高 | 未対応 | ✅ 実装予定 |
| A03 | Injection | 高 | 基本対応 | ✅ 強化予定 |
| A04 | Insecure Design | 中 | 基本対応 | ✅ 強化予定 |
| A05 | Security Misconfiguration | 高 | 未対応 | ✅ 実装予定 |
| A06 | Vulnerable Components | 中 | 一部対応 | 📋 監視継続 |
| A07 | Authentication Failures | 高 | 基本対応 | ✅ 強化予定 |
| A08 | Software Integrity Failures | 中 | 未対応 | ✅ 実装予定 |
| A09 | Logging & Monitoring | 中 | 未対応 | 📋 TASK-403で対応 |
| A10 | Server-Side Request Forgery | 低 | 基本対応 | 📋 継続監視 |

## 詳細実装要件

### 1. HTTPS通信の強制

#### 要件
- 本番環境での完全HTTPS化
- HTTP→HTTPSリダイレクト
- HSTS (HTTP Strict Transport Security) ヘッダー
- セキュア Cookie 設定

#### 実装詳細
```typescript
// Next.js middleware での実装
export function middleware(request: NextRequest) {
  // HTTPS強制リダイレクト
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }
  
  // セキュリティヘッダーの追加
  const response = NextResponse.next()
  
  // HSTS (2年間)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  
  return response
}
```

#### テスト要件
- HTTP→HTTPSリダイレクトのテスト
- HSTSヘッダーの確認
- セキュアCookieの動作確認

### 2. CSRFプロテクション

#### 要件  
- Next.js CSRF トークンの実装
- Server Actions のCSRF対策
- API エンドポイントの保護
- SameSite Cookie 設定

#### 実装詳細
```typescript
// CSRF トークン生成・検証
import { generateToken, verifyToken } from '@/lib/security/csrf'

// Server Action での CSRF 確認
export async function protectedServerAction(
  formData: FormData
) {
  const csrfToken = formData.get('csrfToken') as string
  
  if (!verifyToken(csrfToken)) {
    throw new Error('CSRF token invalid')
  }
  
  // 安全な処理を継続...
}

// Cookie設定の強化
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 7 // 7日間
}
```

#### テスト要件
- CSRFトークン生成・検証テスト
- 不正なトークンでのリクエスト拒否確認
- SameSite Cookie の動作確認

### 3. XSS対策の実装

#### 要件
- Content Security Policy (CSP) の設定
- 入力値のサニタイゼーション
- 出力エスケープの徹底
- Dangerously Set Inner HTML の監査

#### 実装詳細
```typescript
// CSP設定
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js要件
    "style-src 'self' 'unsafe-inline'", // Tailwind要件
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.supabase.co https://googleapis.com",
    "frame-ancestors 'none'",
  ].join('; '),
  
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// 入力サニタイゼーション
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

// React での安全な出力
export function SafeContent({ content }: { content: string }) {
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: sanitizeHtml(content) 
      }} 
    />
  )
}
```

#### テスト要件
- CSPヘッダーの確認
- XSSペイロード注入テスト
- サニタイゼーション機能テスト

### 4. SQLインジェクション対策の確認

#### 要件
- Prisma ORM の安全な使用確認
- パラメータ化クエリの徹底
- 入力値検証の強化
- Raw SQL の使用監査

#### 実装詳細
```typescript
// 安全なPrismaクエリ例
export async function getBooksByUserId(userId: string) {
  // Prismaは自動的にパラメータ化される
  return await prisma.userBook.findMany({
    where: {
      userId: userId, // 安全 - 自動エスケープ
    },
    include: {
      book: true
    }
  })
}

// 入力検証の強化
import { z } from 'zod'

export const BookSearchSchema = z.object({
  query: z.string()
    .min(1, "検索クエリは必須です")
    .max(100, "検索クエリは100文字以内で入力してください")
    .refine(
      (val) => !/[<>\"'%;()&+]/.test(val), 
      "不正な文字が含まれています"
    ),
  limit: z.number().int().min(1).max(100).default(20)
})

// Server Actionでの使用
export async function searchBooks(
  query: string, 
  limit: number = 20
) {
  // スキーマ検証
  const validated = BookSearchSchema.parse({ query, limit })
  
  // 安全なクエリ実行
  return await prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: validated.query, mode: 'insensitive' } },
        { authors: { has: validated.query } }
      ]
    },
    take: validated.limit
  })
}
```

#### テスト要件
- SQLインジェクション攻撃のシミュレーション
- パラメータ化クエリの動作確認
- 入力検証の動作確認

### 5. レート制限の実装

#### 要件
- API エンドポイントのレート制限
- 認証試行回数制限
- ブルートフォース攻撃対策
- IP ベース制限

#### 実装詳細
```typescript
// Redis ベースのレート制限
import { Redis } from 'ioredis'
import { NextRequest } from 'next/server'

export class RateLimiter {
  private redis: Redis

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }

  async checkLimit(
    identifier: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ success: boolean; remainingRequests: number }> {
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    const window = Math.floor(now / windowMs)
    const windowKey = `${key}:${window}`

    const current = await this.redis.incr(windowKey)
    
    if (current === 1) {
      await this.redis.expire(windowKey, Math.ceil(windowMs / 1000))
    }

    return {
      success: current <= limit,
      remainingRequests: Math.max(0, limit - current)
    }
  }
}

// Middleware での使用
export async function rateLimitMiddleware(request: NextRequest) {
  const limiter = new RateLimiter()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // API エンドポイントのレート制限 (100req/hour)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const result = await limiter.checkLimit(
      `api:${ip}`, 
      100, 
      60 * 60 * 1000
    )
    
    if (!result.success) {
      return new Response('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '3600',
          'X-RateLimit-Remaining': '0'
        }
      })
    }
  }
  
  // 認証エンドポイント制限 (5req/15min)
  if (request.nextUrl.pathname === '/api/auth/signin') {
    const result = await limiter.checkLimit(
      `auth:${ip}`, 
      5, 
      15 * 60 * 1000
    )
    
    if (!result.success) {
      return new Response('Authentication rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': '900'
        }
      })
    }
  }
}
```

#### テスト要件
- レート制限の動作確認
- 制限超過時の適切な応答確認
- 異なるIPでの独立性確認

### 6. セキュリティヘッダーの設定

#### 要件
- 包括的なセキュリティヘッダー設定
- ブラウザセキュリティ機能の活用
- セキュリティポリシーの実装

#### 実装詳細
```typescript
// 完全なセキュリティヘッダー設定
export const SECURITY_HEADERS = {
  // HTTPS強制
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // XSS防止
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // リファラー制御
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // 権限制御
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),
  
  // CSP (Content Security Policy)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://books.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
} as const

// Next.js middleware での適用
export function applySecurityHeaders(response: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}
```

## 認証・認可強化

### セッション管理強化
```typescript
// セッション整合性確認
export async function validateSession(sessionToken: string) {
  const session = await getSession(sessionToken)
  
  if (!session) return null
  
  // セッションハイジャック対策
  const fingerprint = generateFingerprint(request)
  if (session.fingerprint !== fingerprint) {
    await invalidateSession(sessionToken)
    return null
  }
  
  // セッション再生攻撃対策  
  if (session.lastActivity < Date.now() - SESSION_TIMEOUT) {
    await invalidateSession(sessionToken)
    return null
  }
  
  // セッション更新
  await updateSessionActivity(sessionToken)
  
  return session
}

// セッション作成時のフィンガープリント生成
function generateFingerprint(request: NextRequest): string {
  const components = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept-language') || '',
    request.ip || ''
  ]
  
  return createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
}
```

## データ保護

### 機密データの暗号化
```typescript
// AES-256-GCM暗号化
import { createCipher, createDecipher, randomBytes } from 'crypto'

export class DataEncryption {
  private readonly algorithm = 'aes-256-gcm'
  private readonly key: Buffer

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12) // GCM推奨IVサイズ
    const cipher = createCipher(this.algorithm, this.key, { iv })
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = createDecipher(this.algorithm, this.key, { iv })
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}
```

## エラーハンドリングのセキュリティ

### 情報漏洩防止
```typescript
// セキュリティを考慮したエラーレスポンス
export function createSecureErrorResponse(
  error: Error, 
  isProduction: boolean
) {
  // 本番環境では詳細なエラー情報を隠蔽
  if (isProduction) {
    // 汎用的なエラーメッセージ
    return {
      success: false,
      message: 'リクエストの処理中にエラーが発生しました',
      code: 'INTERNAL_ERROR'
    }
  }
  
  // 開発環境では詳細情報を提供
  return {
    success: false,
    message: error.message,
    code: error.name,
    stack: error.stack
  }
}
```

## セキュリティ監査ログ

### セキュリティイベントのログ出力
```typescript
export interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'input_validation' | 'rate_limit'
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  userId?: string
  ip?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export class SecurityLogger {
  static log(event: SecurityEvent) {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString()
    }
    
    // 本番環境での構造化ログ出力
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry))
    } else {
      console.log(`[SECURITY ${event.level.toUpperCase()}]`, event.message, event.metadata)
    }
    
    // 重要なセキュリティイベントの外部通知
    if (event.level === 'critical') {
      this.notifySecurityTeam(event)
    }
  }
  
  private static async notifySecurityTeam(event: SecurityEvent) {
    // セキュリティチームへの通知実装
    // (例: Slack, Email, PagerDuty等)
  }
}
```

## 受け入れ基準

### 機能要件
- [ ] HTTPS強制リダイレクトが動作する
- [ ] CSRFトークン検証が正常に動作する
- [ ] XSS攻撃が適切にブロックされる
- [ ] SQLインジェクション攻撃が防がれる
- [ ] レート制限が正常に機能する
- [ ] セキュリティヘッダーが適切に設定される

### セキュリティ要件
- [ ] OWASP Top 10 の主要脅威に対策済み
- [ ] セキュリティテストがすべてパスする
- [ ] 認証・認可が正常に動作する
- [ ] セッション管理が安全に実装されている

### パフォーマンス要件
- [ ] セキュリティ機能による性能劣化が10%以内
- [ ] レート制限の応答時間が100ms以内

### 監視要件
- [ ] セキュリティイベントが適切にログ出力される
- [ ] 異常なアクセスパターンが検知される
- [ ] セキュリティメトリクスが監視可能

## 実装優先度

### Phase 1: 基盤セキュリティ
1. セキュリティヘッダーの設定
2. HTTPS通信の強制
3. 基本的なXSS対策

### Phase 2: アプリケーションセキュリティ  
1. CSRF プロテクション
2. 入力値検証の強化
3. セッション管理の強化

### Phase 3: 運用セキュリティ
1. レート制限の実装
2. セキュリティログの実装
3. 監視・アラートの設定

### Phase 4: 高度なセキュリティ
1. データ暗号化の実装
2. セキュリティ監査機能
3. 自動脅威検知

## リスク評価

### 高リスク
- **データ漏洩**: 機密情報の不正アクセス
- **認証バイパス**: 不正ログイン
- **コード実行**: XSS/インジェクション攻撃

### 中リスク  
- **サービス妨害**: レート制限なしのDDoS攻撃
- **セッションハイジャック**: 不適切なセッション管理

### 低リスク
- **情報収集**: 過度なエラー情報の露出
- **設定ミス**: セキュリティヘッダーの不備

## 成功指標

### セキュリティ指標
- **脆弱性件数**: 0件 (高・中リスク)
- **セキュリティテスト通過率**: 100%
- **OWASP対応率**: 90%以上

### 運用指標
- **セキュリティインシデント**: 0件/月
- **不正アクセス試行検知率**: 95%以上
- **レスポンス時間影響**: 10%以内