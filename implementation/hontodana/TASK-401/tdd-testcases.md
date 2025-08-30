# TASK-401: セキュリティ強化 - テストケース

## テスト戦略

### テストピラミッド
1. **単体テスト**: セキュリティ関数・ユーティリティ
2. **統合テスト**: セキュリティミドルウェア・API
3. **E2Eテスト**: セキュリティ攻撃シナリオ
4. **セキュリティテスト**: ペネトレーションテスト

### テストツール
- **Jest**: 単体・統合テスト
- **Supertest**: API セキュリティテスト
- **Playwright**: E2E セキュリティテスト
- **OWASP ZAP**: 自動セキュリティスキャン

## 1. セキュリティヘッダーテスト

### テストファイル: `__tests__/security/headers.test.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { applySecurityHeaders, SECURITY_HEADERS } from '@/lib/security/headers'

describe('Security Headers', () => {
  test('should apply all required security headers', () => {
    const response = NextResponse.next()
    const securedResponse = applySecurityHeaders(response)

    // 必須セキュリティヘッダーの確認
    expect(securedResponse.headers.get('Strict-Transport-Security'))
      .toBe('max-age=63072000; includeSubDomains; preload')
    
    expect(securedResponse.headers.get('X-Content-Type-Options'))
      .toBe('nosniff')
    
    expect(securedResponse.headers.get('X-Frame-Options'))
      .toBe('DENY')
    
    expect(securedResponse.headers.get('X-XSS-Protection'))
      .toBe('1; mode=block')
    
    expect(securedResponse.headers.get('Referrer-Policy'))
      .toBe('strict-origin-when-cross-origin')
    
    expect(securedResponse.headers.get('Content-Security-Policy'))
      .toContain("default-src 'self'")
  })

  test('should include CSP directives for all required sources', () => {
    const response = NextResponse.next()
    const securedResponse = applySecurityHeaders(response)
    const csp = securedResponse.headers.get('Content-Security-Policy')

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("style-src 'self'")
    expect(csp).toContain("img-src 'self' data: https: blob:")
    expect(csp).toContain("connect-src 'self' https://*.supabase.co")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("upgrade-insecure-requests")
  })

  test('should set permissions policy to restrict dangerous features', () => {
    const response = NextResponse.next()
    const securedResponse = applySecurityHeaders(response)
    const permissionsPolicy = securedResponse.headers.get('Permissions-Policy')

    expect(permissionsPolicy).toContain('camera=()')
    expect(permissionsPolicy).toContain('microphone=()')
    expect(permissionsPolicy).toContain('geolocation=()')
    expect(permissionsPolicy).toContain('payment=()')
  })

  test('should validate HSTS header configuration', () => {
    const response = NextResponse.next()
    const securedResponse = applySecurityHeaders(response)
    const hsts = securedResponse.headers.get('Strict-Transport-Security')

    // 2年間の設定確認
    expect(hsts).toMatch(/max-age=63072000/)
    expect(hsts).toMatch(/includeSubDomains/)
    expect(hsts).toMatch(/preload/)
  })
})
```

## 2. HTTPS強制テスト

### テストファイル: `__tests__/security/https-redirect.test.ts`

```typescript
import { NextRequest } from 'next/server'
import { httpsRedirectMiddleware } from '@/lib/security/https'

describe('HTTPS Redirect Middleware', () => {
  const createMockRequest = (
    protocol: string = 'https',
    host: string = 'example.com',
    pathname: string = '/'
  ): NextRequest => {
    return new NextRequest(
      new Request(`${protocol}://${host}${pathname}`),
      {
        headers: {
          'x-forwarded-proto': protocol,
          'host': host
        }
      }
    )
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'production'
  })

  afterEach(() => {
    process.env.NODE_ENV = 'test'
  })

  test('should redirect HTTP to HTTPS in production', async () => {
    const request = createMockRequest('http', 'example.com', '/library')
    const response = await httpsRedirectMiddleware(request)

    expect(response.status).toBe(301)
    expect(response.headers.get('location'))
      .toBe('https://example.com/library')
  })

  test('should not redirect HTTPS requests', async () => {
    const request = createMockRequest('https', 'example.com', '/library')
    const response = await httpsRedirectMiddleware(request)

    expect(response).toBeNull() // No redirect needed
  })

  test('should not redirect in development environment', async () => {
    process.env.NODE_ENV = 'development'
    
    const request = createMockRequest('http', 'localhost:3000', '/library')
    const response = await httpsRedirectMiddleware(request)

    expect(response).toBeNull() // No redirect in development
  })

  test('should preserve query parameters in redirect', async () => {
    const request = createMockRequest('http', 'example.com', '/search?q=test')
    const response = await httpsRedirectMiddleware(request)

    expect(response.status).toBe(301)
    expect(response.headers.get('location'))
      .toBe('https://example.com/search?q=test')
  })
})
```

## 3. CSRF プロテクションテスト

### テストファイル: `__tests__/security/csrf.test.ts`

```typescript
import { generateToken, verifyToken, CSRFError } from '@/lib/security/csrf'

describe('CSRF Protection', () => {
  test('should generate valid CSRF token', () => {
    const token = generateToken()
    
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)
  })

  test('should verify valid token', () => {
    const token = generateToken()
    const isValid = verifyToken(token)
    
    expect(isValid).toBe(true)
  })

  test('should reject invalid token', () => {
    const invalidToken = 'invalid-token-12345'
    const isValid = verifyToken(invalidToken)
    
    expect(isValid).toBe(false)
  })

  test('should reject expired token', async () => {
    // モック時間を設定してトークンを生成
    const originalNow = Date.now
    Date.now = jest.fn(() => 1000000) // 初期時間
    
    const token = generateToken()
    
    // 2時間後に設定（トークン有効期限は1時間）
    Date.now = jest.fn(() => 1000000 + 2 * 60 * 60 * 1000)
    
    const isValid = verifyToken(token)
    expect(isValid).toBe(false)
    
    // 時間をリストア
    Date.now = originalNow
  })

  test('should protect server action with CSRF', async () => {
    const formData = new FormData()
    const validToken = generateToken()
    formData.append('csrfToken', validToken)
    formData.append('title', 'Test Book')

    const result = await protectedServerAction(formData)
    expect(result.success).toBe(true)
  })

  test('should reject server action with invalid CSRF token', async () => {
    const formData = new FormData()
    formData.append('csrfToken', 'invalid-token')
    formData.append('title', 'Test Book')

    await expect(protectedServerAction(formData))
      .rejects.toThrow(CSRFError)
  })

  test('should reject server action without CSRF token', async () => {
    const formData = new FormData()
    formData.append('title', 'Test Book')

    await expect(protectedServerAction(formData))
      .rejects.toThrow(CSRFError)
  })
})

// Mock Server Action for testing
async function protectedServerAction(formData: FormData) {
  const csrfToken = formData.get('csrfToken') as string
  
  if (!csrfToken || !verifyToken(csrfToken)) {
    throw new CSRFError('Invalid CSRF token')
  }
  
  return { success: true }
}
```

## 4. XSS対策テスト

### テストファイル: `__tests__/security/xss.test.ts`

```typescript
import { sanitizeHtml } from '@/lib/security/xss'
import { render, screen } from '@testing-library/react'
import { SafeContent } from '@/components/security/SafeContent'

describe('XSS Protection', () => {
  const maliciousPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<div onload="alert(\'XSS\')">content</div>',
    '<a href="javascript:alert(\'XSS\')">click me</a>',
    '<svg onload="alert(\'XSS\')"></svg>',
    '<object data="javascript:alert(\'XSS\')"></object>',
    '<embed src="javascript:alert(\'XSS\')"></embed>'
  ]

  test.each(maliciousPayloads)(
    'should sanitize malicious payload: %s',
    (payload) => {
      const sanitized = sanitizeHtml(payload)
      
      // スクリプトタグが削除されていること
      expect(sanitized).not.toContain('<script')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('onerror=')
      expect(sanitized).not.toContain('onload=')
    }
  )

  test('should preserve safe HTML tags', () => {
    const safeHtml = '<p>This is <strong>safe</strong> <em>content</em></p>'
    const sanitized = sanitizeHtml(safeHtml)
    
    expect(sanitized).toContain('<p>')
    expect(sanitized).toContain('<strong>')
    expect(sanitized).toContain('<em>')
    expect(sanitized).toContain('safe')
    expect(sanitized).toContain('content')
  })

  test('should remove unsafe attributes', () => {
    const unsafeHtml = '<div onclick="alert()" style="color:red" class="test">content</div>'
    const sanitized = sanitizeHtml(unsafeHtml)
    
    expect(sanitized).not.toContain('onclick')
    expect(sanitized).not.toContain('alert()')
    // styleとclassは許可される場合のテスト
    // 実際の設定に応じて調整
  })

  test('SafeContent component should render sanitized content', () => {
    const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>'
    
    render(<SafeContent content={maliciousContent} />)
    
    // 安全なコンテンツのみが表示される
    expect(screen.getByText('Safe content')).toBeInTheDocument()
    
    // スクリプトタグは存在しない
    expect(document.querySelector('script')).not.toBeInTheDocument()
  })

  test('should handle empty and null inputs safely', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(null as any)).toBe('')
    expect(sanitizeHtml(undefined as any)).toBe('')
  })

  test('should limit content length to prevent DoS', () => {
    const longContent = 'a'.repeat(100000) // 100KB
    const sanitized = sanitizeHtml(longContent)
    
    // 適切な長さに制限されていること
    expect(sanitized.length).toBeLessThanOrEqual(50000) // 50KB制限
  })
})
```

## 5. レート制限テスト

### テストファイル: `__tests__/security/rate-limit.test.ts`

```typescript
import { RateLimiter } from '@/lib/security/rate-limit'
import Redis from 'ioredis-mock'

// Redis モックの設定
jest.mock('ioredis', () => require('ioredis-mock'))

describe('Rate Limiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter()
  })

  afterEach(() => {
    // Redis モックをクリア
    jest.clearAllMocks()
  })

  test('should allow requests within limit', async () => {
    const identifier = 'test-user-1'
    const limit = 5
    const windowMs = 60000 // 1分

    // 制限内のリクエスト
    for (let i = 1; i <= limit; i++) {
      const result = await rateLimiter.checkLimit(identifier, limit, windowMs)
      
      expect(result.success).toBe(true)
      expect(result.remainingRequests).toBe(limit - i)
    }
  })

  test('should reject requests exceeding limit', async () => {
    const identifier = 'test-user-2'
    const limit = 3
    const windowMs = 60000

    // 制限いっぱいまでリクエスト
    for (let i = 0; i < limit; i++) {
      await rateLimiter.checkLimit(identifier, limit, windowMs)
    }

    // 制限を超えるリクエスト
    const result = await rateLimiter.checkLimit(identifier, limit, windowMs)
    
    expect(result.success).toBe(false)
    expect(result.remainingRequests).toBe(0)
  })

  test('should reset limit after window expires', async () => {
    const identifier = 'test-user-3'
    const limit = 2
    const windowMs = 1000 // 1秒

    // 制限まで使用
    await rateLimiter.checkLimit(identifier, limit, windowMs)
    await rateLimiter.checkLimit(identifier, limit, windowMs)

    // 制限を超える
    let result = await rateLimiter.checkLimit(identifier, limit, windowMs)
    expect(result.success).toBe(false)

    // ウィンドウの有効期限を待つ
    await new Promise(resolve => setTimeout(resolve, 1100))

    // 新しいウィンドウでリクエスト成功
    result = await rateLimiter.checkLimit(identifier, limit, windowMs)
    expect(result.success).toBe(true)
  })

  test('should handle different identifiers independently', async () => {
    const limit = 2
    const windowMs = 60000

    // ユーザー1が制限まで使用
    await rateLimiter.checkLimit('user-1', limit, windowMs)
    await rateLimiter.checkLimit('user-1', limit, windowMs)

    // ユーザー1は制限を超える
    let result = await rateLimiter.checkLimit('user-1', limit, windowMs)
    expect(result.success).toBe(false)

    // ユーザー2は正常に使用可能
    result = await rateLimiter.checkLimit('user-2', limit, windowMs)
    expect(result.success).toBe(true)
  })
})
```

## 6. 入力検証テスト

### テストファイル: `__tests__/security/input-validation.test.ts`

```typescript
import { BookSearchSchema, CreateBookSchema } from '@/lib/schemas/book'
import { validateUserInput } from '@/lib/security/input-validation'

describe('Input Validation', () => {
  describe('BookSearchSchema', () => {
    test('should accept valid search query', () => {
      const validInput = {
        query: 'JavaScript Programming',
        limit: 20
      }

      const result = BookSearchSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    test('should reject query with malicious characters', () => {
      const maliciousInputs = [
        { query: '<script>alert()</script>', limit: 20 },
        { query: "'; DROP TABLE users; --", limit: 20 },
        { query: 'test" OR 1=1', limit: 20 },
        { query: 'test<img onerror="alert()">', limit: 20 }
      ]

      maliciousInputs.forEach(input => {
        const result = BookSearchSchema.safeParse(input)
        expect(result.success).toBe(false)
        
        if (!result.success) {
          expect(result.error.issues[0].message)
            .toContain('不正な文字が含まれています')
        }
      })
    })

    test('should reject query that is too long', () => {
      const longQuery = 'a'.repeat(101) // 100文字制限を超える
      const input = { query: longQuery, limit: 20 }

      const result = BookSearchSchema.safeParse(input)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message)
          .toContain('100文字以内で入力してください')
      }
    })

    test('should reject invalid limit values', () => {
      const invalidLimits = [
        { query: 'test', limit: 0 },      // 最小値未満
        { query: 'test', limit: 101 },    // 最大値超過
        { query: 'test', limit: -5 },     // 負の値
        { query: 'test', limit: 1.5 }     // 非整数
      ]

      invalidLimits.forEach(input => {
        const result = BookSearchSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('CreateBookSchema', () => {
    const validBook = {
      title: 'Valid Book Title',
      authors: ['Author One', 'Author Two'],
      isbn: '978-0123456789',
      publisher: 'Test Publisher',
      publishedDate: '2024-01-01',
      pageCount: 300,
      description: 'A valid book description'
    }

    test('should accept valid book data', () => {
      const result = CreateBookSchema.safeParse(validBook)
      expect(result.success).toBe(true)
    })

    test('should reject book with XSS in title', () => {
      const maliciousBook = {
        ...validBook,
        title: 'Book<script>alert("XSS")</script>'
      }

      const result = CreateBookSchema.safeParse(maliciousBook)
      expect(result.success).toBe(false)
    })

    test('should reject book with invalid ISBN', () => {
      const invalidISBNs = [
        '123-invalid-isbn',
        '978-01234567890', // 桁数が多い
        'not-a-number',
        '<script>alert()</script>'
      ]

      invalidISBNs.forEach(isbn => {
        const invalidBook = { ...validBook, isbn }
        const result = CreateBookSchema.safeParse(invalidBook)
        expect(result.success).toBe(false)
      })
    })

    test('should sanitize description content', () => {
      const bookWithHTML = {
        ...validBook,
        description: 'This book is <strong>great</strong> and <script>alert("bad")</script>'
      }

      const result = CreateBookSchema.safeParse(bookWithHTML)
      
      if (result.success) {
        // 安全なHTMLは保持、危険なものは除去
        expect(result.data.description).toContain('<strong>great</strong>')
        expect(result.data.description).not.toContain('<script>')
      }
    })
  })

  describe('validateUserInput', () => {
    test('should detect SQL injection patterns', () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; DELETE FROM books WHERE 1=1",
        "UNION SELECT * FROM users",
        "'; INSERT INTO admin (user) VALUES ('hacker'); --"
      ]

      sqlInjectionPayloads.forEach(payload => {
        const result = validateUserInput(payload)
        expect(result.isValid).toBe(false)
        expect(result.threats).toContain('sql_injection')
      })
    })

    test('should detect XSS patterns', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert()"></iframe>',
        'onload="alert(1)"'
      ]

      xssPayloads.forEach(payload => {
        const result = validateUserInput(payload)
        expect(result.isValid).toBe(false)
        expect(result.threats).toContain('xss')
      })
    })

    test('should allow safe input', () => {
      const safeInputs = [
        'Hello World',
        'JavaScript Programming Book',
        'user@example.com',
        '2024-01-01',
        'ISBN: 978-0123456789'
      ]

      safeInputs.forEach(input => {
        const result = validateUserInput(input)
        expect(result.isValid).toBe(true)
        expect(result.threats).toHaveLength(0)
      })
    })
  })
})
```

## 7. 認証・セッション管理テスト

### テストファイル: `__tests__/security/session.test.ts`

```typescript
import { validateSession, generateFingerprint, SessionManager } from '@/lib/security/session'
import { NextRequest } from 'next/server'

describe('Session Management', () => {
  const mockRequest = (
    userAgent: string = 'Mozilla/5.0',
    acceptLanguage: string = 'en-US,en;q=0.9',
    ip: string = '192.168.1.1'
  ): NextRequest => {
    return new NextRequest(
      new Request('https://example.com'),
      {
        headers: {
          'user-agent': userAgent,
          'accept-language': acceptLanguage
        },
        ip
      }
    )
  }

  describe('generateFingerprint', () => {
    test('should generate consistent fingerprint for same request', () => {
      const request = mockRequest()
      const fingerprint1 = generateFingerprint(request)
      const fingerprint2 = generateFingerprint(request)
      
      expect(fingerprint1).toBe(fingerprint2)
      expect(fingerprint1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    })

    test('should generate different fingerprints for different requests', () => {
      const request1 = mockRequest('Chrome/100.0', 'en-US', '192.168.1.1')
      const request2 = mockRequest('Firefox/95.0', 'ja-JP', '192.168.1.2')
      
      const fingerprint1 = generateFingerprint(request1)
      const fingerprint2 = generateFingerprint(request2)
      
      expect(fingerprint1).not.toBe(fingerprint2)
    })
  })

  describe('validateSession', () => {
    let sessionManager: SessionManager

    beforeEach(() => {
      sessionManager = new SessionManager()
    })

    test('should validate legitimate session', async () => {
      const request = mockRequest()
      const fingerprint = generateFingerprint(request)
      
      // セッション作成
      const session = await sessionManager.createSession({
        userId: 'user-123',
        fingerprint,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1時間後
      })

      const validatedSession = await validateSession(session.token, request)
      
      expect(validatedSession).toBeDefined()
      expect(validatedSession!.userId).toBe('user-123')
    })

    test('should reject session with wrong fingerprint (session hijacking)', async () => {
      const originalRequest = mockRequest('Chrome/100.0', 'en-US', '192.168.1.1')
      const hijackedRequest = mockRequest('Firefox/95.0', 'ja-JP', '192.168.1.2')
      
      const originalFingerprint = generateFingerprint(originalRequest)
      
      // 元のリクエストでセッション作成
      const session = await sessionManager.createSession({
        userId: 'user-123',
        fingerprint: originalFingerprint,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      })

      // 異なるリクエストでセッション検証（ハイジャック試行）
      const validatedSession = await validateSession(session.token, hijackedRequest)
      
      expect(validatedSession).toBeNull()
    })

    test('should reject expired session', async () => {
      const request = mockRequest()
      const fingerprint = generateFingerprint(request)
      
      // 既に期限切れのセッション作成
      const session = await sessionManager.createSession({
        userId: 'user-123',
        fingerprint,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1時間前
      })

      const validatedSession = await validateSession(session.token, request)
      
      expect(validatedSession).toBeNull()
    })

    test('should update session activity on valid access', async () => {
      const request = mockRequest()
      const fingerprint = generateFingerprint(request)
      
      const session = await sessionManager.createSession({
        userId: 'user-123',
        fingerprint,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      })

      const originalLastActivity = session.lastActivity
      
      // 少し待ってからセッション検証
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const validatedSession = await validateSession(session.token, request)
      
      expect(validatedSession!.lastActivity.getTime())
        .toBeGreaterThan(originalLastActivity.getTime())
    })

    test('should invalidate session after suspicious activity', async () => {
      const request = mockRequest()
      const fingerprint = generateFingerprint(request)
      
      const session = await sessionManager.createSession({
        userId: 'user-123',
        fingerprint,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      })

      // セッションを無効化（不審な活動を検知したと仮定）
      await sessionManager.invalidateSession(session.token, 'suspicious_activity')

      const validatedSession = await validateSession(session.token, request)
      
      expect(validatedSession).toBeNull()
    })
  })
})
```

## 8. データ暗号化テスト

### テストファイル: `__tests__/security/encryption.test.ts`

```typescript
import { DataEncryption } from '@/lib/security/encryption'

describe('Data Encryption', () => {
  let encryption: DataEncryption

  beforeEach(() => {
    // テスト用の暗号化キーを設定
    process.env.ENCRYPTION_KEY = 'a'.repeat(64) // 32バイトのキー
    encryption = new DataEncryption()
  })

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY
  })

  test('should encrypt and decrypt data correctly', () => {
    const plaintext = 'This is sensitive information'
    
    const encrypted = encryption.encrypt(plaintext)
    const decrypted = encryption.decrypt(encrypted)
    
    expect(decrypted).toBe(plaintext)
    expect(encrypted).not.toBe(plaintext)
  })

  test('should produce different ciphertext for same plaintext', () => {
    const plaintext = 'Same data'
    
    const encrypted1 = encryption.encrypt(plaintext)
    const encrypted2 = encryption.encrypt(plaintext)
    
    // IVが異なるため、同じ平文でも暗号文は異なる
    expect(encrypted1).not.toBe(encrypted2)
    
    // しかし復号すると同じ値
    expect(encryption.decrypt(encrypted1)).toBe(plaintext)
    expect(encryption.decrypt(encrypted2)).toBe(plaintext)
  })

  test('should handle empty and special characters', () => {
    const testCases = [
      '',
      ' ',
      'Hello\nWorld\t!',
      '🔐🔒 Encrypted data with emoji 🔓',
      '<script>alert("XSS")</script>',
      'User input with "quotes" and \'apostrophes\''
    ]

    testCases.forEach(plaintext => {
      const encrypted = encryption.encrypt(plaintext)
      const decrypted = encryption.decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  test('should fail with tampered ciphertext', () => {
    const plaintext = 'Important secret data'
    const encrypted = encryption.encrypt(plaintext)
    
    // 暗号文を改ざん
    const [iv, authTag, ciphertext] = encrypted.split(':')
    const tamperedCiphertext = ciphertext.slice(0, -2) + 'XX'
    const tamperedEncrypted = `${iv}:${authTag}:${tamperedCiphertext}`
    
    expect(() => {
      encryption.decrypt(tamperedEncrypted)
    }).toThrow()
  })

  test('should fail with invalid format', () => {
    const invalidFormats = [
      'invalid-format',
      'part1:part2', // 不十分な部分
      'part1:part2:part3:part4', // 過剰な部分
      '::', // 空の部分
      'notHex:notHex:notHex' // 非16進文字列
    ]

    invalidFormats.forEach(invalid => {
      expect(() => {
        encryption.decrypt(invalid)
      }).toThrow()
    })
  })

  test('should handle large data efficiently', () => {
    const largeData = 'x'.repeat(100000) // 100KB
    const startTime = Date.now()
    
    const encrypted = encryption.encrypt(largeData)
    const decrypted = encryption.decrypt(encrypted)
    
    const endTime = Date.now()
    
    expect(decrypted).toBe(largeData)
    expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
  })
})
```

## 9. E2E セキュリティテスト

### テストファイル: `tests/e2e/security.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test'

test.describe('Security E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // セキュリティヘッダーの確認を含むページ読み込み
    await page.goto('/')
  })

  test('should enforce security headers', async ({ page }) => {
    const response = await page.goto('/')
    
    // 必須セキュリティヘッダーの確認
    expect(response!.headers()['strict-transport-security'])
      .toContain('max-age=63072000')
    
    expect(response!.headers()['x-content-type-options'])
      .toBe('nosniff')
    
    expect(response!.headers()['x-frame-options'])
      .toBe('DENY')
    
    expect(response!.headers()['content-security-policy'])
      .toContain("default-src 'self'")
  })

  test('should prevent XSS attacks in search', async ({ page }) => {
    await page.goto('/search')
    
    const xssPayload = '<script>window.XSS_EXECUTED = true</script>'
    
    // 検索フィールドにXSSペイロードを入力
    await page.fill('[data-testid="search-input"]', xssPayload)
    await page.click('[data-testid="search-button"]')
    
    // XSSが実行されていないことを確認
    const xssExecuted = await page.evaluate(() => (window as any).XSS_EXECUTED)
    expect(xssExecuted).toBeUndefined()
    
    // ペイロードがエスケープされて表示されていることを確認
    expect(await page.textContent('[data-testid="search-results"]'))
      .not.toContain('<script>')
  })

  test('should enforce CSRF protection on forms', async ({ page }) => {
    await page.goto('/library/add')
    
    // CSRFトークンが存在することを確認
    const csrfToken = await page.getAttribute('input[name="csrfToken"]', 'value')
    expect(csrfToken).toBeTruthy()
    expect(csrfToken!.length).toBeGreaterThan(20)
  })

  test('should enforce rate limiting', async ({ page }) => {
    const searchUrl = '/api/books/search'
    const requests = []
    
    // 短時間で大量のリクエストを送信
    for (let i = 0; i < 150; i++) {
      requests.push(
        page.request.get(`${searchUrl}?q=test&page=${i}`)
      )
    }
    
    const responses = await Promise.all(requests)
    
    // いくつかのリクエストがレート制限で拒否されることを確認
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
    
    // レート制限ヘッダーの確認
    const rateLimitedResponse = rateLimitedResponses[0]
    expect(rateLimitedResponse.headers()['retry-after']).toBeTruthy()
  })

  test('should secure cookie settings', async ({ page, context }) => {
    await page.goto('/')
    
    const cookies = await context.cookies()
    
    cookies.forEach(cookie => {
      if (cookie.name.includes('session') || cookie.name.includes('auth')) {
        // セッション関連Cookieはセキュア設定されている
        expect(cookie.secure).toBe(true)
        expect(cookie.httpOnly).toBe(true)
        expect(cookie.sameSite).toBe('Strict')
      }
    })
  })

  test('should redirect HTTP to HTTPS in production', async ({ page }) => {
    // Note: This test would need to be configured for production environment
    // or use a test environment that mimics production HTTPS behavior
    
    // HTTP リクエストのテスト（本番環境でのみ有効）
    if (process.env.NODE_ENV === 'production') {
      const response = await page.request.get('http://example.com/')
      expect(response.status()).toBe(301)
      expect(response.headers().location).toMatch(/^https:\/\//)
    }
  })

  test('should prevent clickjacking with X-Frame-Options', async ({ page }) => {
    // iframeでの読み込みが拒否されることをテスト
    await page.setContent(`
      <iframe src="${page.url()}" width="800" height="600"></iframe>
    `)
    
    // フレーム読み込みエラーを待つ
    await page.waitForTimeout(2000)
    
    // iframeの内容が読み込まれていないことを確認
    const iframe = page.locator('iframe')
    const iframeContent = await iframe.contentFrame()
    expect(iframeContent).toBeNull()
  })

  test('should validate file upload security', async ({ page }) => {
    await page.goto('/profile')
    
    // 危険なファイル拡張子のアップロードを試行
    const dangerousFiles = [
      'malicious.exe',
      'script.js',
      'shell.sh',
      'dangerous.bat'
    ]
    
    for (const filename of dangerousFiles) {
      await page.setInputFiles('[data-testid="file-upload"]', {
        name: filename,
        mimeType: 'application/octet-stream',
        buffer: Buffer.from('fake file content')
      })
      
      await page.click('[data-testid="upload-button"]')
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('[data-testid="error-message"]'))
        .toContainText('許可されていないファイル形式です')
    }
  })
})
```

## 10. セキュリティ監査テスト

### テストファイル: `__tests__/security/audit.test.ts`

```typescript
import { SecurityLogger, SecurityEvent } from '@/lib/security/logger'

describe('Security Audit', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test('should log authentication events', () => {
    const event: SecurityEvent = {
      type: 'authentication',
      level: 'info',
      message: 'User logged in successfully',
      userId: 'user-123',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date(),
      metadata: { method: 'email' }
    }

    SecurityLogger.log(event)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('authentication')
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('user-123')
    )
  })

  test('should log failed authentication attempts', () => {
    const event: SecurityEvent = {
      type: 'authentication',
      level: 'warning',
      message: 'Failed login attempt',
      ip: '192.168.1.100',
      userAgent: 'curl/7.68.0',
      timestamp: new Date(),
      metadata: { 
        email: 'admin@example.com',
        failureReason: 'invalid_password'
      }
    }

    SecurityLogger.log(event)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed login attempt')
    )
  })

  test('should log input validation failures', () => {
    const event: SecurityEvent = {
      type: 'input_validation',
      level: 'error',
      message: 'Malicious input detected',
      userId: 'user-456',
      ip: '10.0.0.1',
      timestamp: new Date(),
      metadata: {
        input: '<script>alert("XSS")</script>',
        field: 'book_title',
        threat_type: 'xss'
      }
    }

    SecurityLogger.log(event)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Malicious input detected')
    )
  })

  test('should trigger alerts for critical events', () => {
    const notifySpy = jest.spyOn(SecurityLogger as any, 'notifySecurityTeam')
      .mockImplementation()

    const criticalEvent: SecurityEvent = {
      type: 'authorization',
      level: 'critical',
      message: 'Potential privilege escalation attempt',
      userId: 'user-789',
      ip: '203.0.113.1',
      timestamp: new Date(),
      metadata: {
        attempted_action: 'admin_panel_access',
        user_role: 'user'
      }
    }

    SecurityLogger.log(criticalEvent)

    expect(notifySpy).toHaveBeenCalledWith(criticalEvent)
    
    notifySpy.mockRestore()
  })
})
```

## テスト実行コマンド

```bash
# 全セキュリティテストの実行
npm test -- --testPathPattern=security

# 特定カテゴリのテスト実行
npm test -- __tests__/security/headers.test.ts
npm test -- __tests__/security/csrf.test.ts
npm test -- __tests__/security/xss.test.ts
npm test -- __tests__/security/rate-limit.test.ts

# E2Eセキュリティテスト
npm run test:e2e -- tests/e2e/security.spec.ts

# セキュリティ監査テスト
npm test -- __tests__/security/audit.test.ts

# カバレッジ付きテスト実行
npm test -- --testPathPattern=security --coverage

# 継続的セキュリティテスト
npm run test:security:watch
```

## テストデータとモック

### セキュリティテスト用のモックデータ

```typescript
// __tests__/fixtures/security-test-data.ts
export const SECURITY_TEST_PAYLOADS = {
  XSS: [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("XSS")',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)"></iframe>'
  ],
  
  SQL_INJECTION: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1; DELETE FROM books",
    "UNION SELECT * FROM users",
    "'; INSERT INTO admin VALUES ('hacker'); --"
  ],
  
  CSRF: [
    'fake-csrf-token',
    '',
    'expired-token-12345',
    '<script>document.cookie="csrf=hacked"</script>'
  ],
  
  RATE_LIMIT_TEST: {
    normalUser: 'user-normal-123',
    attackerUser: 'user-attacker-456',
    requestLimit: 100,
    timeWindow: 3600000 // 1時間
  }
}
```

## セキュリティテストの品質基準

### カバレッジ要件
- **セキュリティ関数**: 100%
- **セキュリティミドルウェア**: 95%以上
- **認証・認可**: 100%
- **入力検証**: 95%以上

### パフォーマンス要件
- **セキュリティテスト実行時間**: 5分以内
- **レート制限テスト**: 30秒以内
- **暗号化・復号テスト**: 1秒以内

### セキュリティ基準
- **OWASP Top 10**: 90%以上対応確認
- **偽陽性率**: 5%以下
- **偽陰性率**: 1%以下