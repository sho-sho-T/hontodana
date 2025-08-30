# TASK-401: セキュリティ強化 - RED Phase (失敗テスト実装)

## フェーズ概要

TDDのRed Phaseとして、セキュリティ機能がまだ実装されていない状態でテストを作成し、適切に失敗することを確認します。

## 実装するテスト

### 1. セキュリティヘッダーテスト（失敗版）

#### テストファイル: `__tests__/security/headers.test.ts`

```typescript
import { NextResponse } from 'next/server'
import { applySecurityHeaders, SECURITY_HEADERS } from '@/lib/security/headers'

describe('Security Headers', () => {
  test('should apply all required security headers', () => {
    const response = NextResponse.next()
    // この関数はまだ存在しないため失敗する
    const securedResponse = applySecurityHeaders(response)

    expect(securedResponse.headers.get('Strict-Transport-Security'))
      .toBe('max-age=63072000; includeSubDomains; preload')
    
    expect(securedResponse.headers.get('X-Content-Type-Options'))
      .toBe('nosniff')
    
    expect(securedResponse.headers.get('X-Frame-Options'))
      .toBe('DENY')
  })

  test('should include comprehensive CSP policy', () => {
    const response = NextResponse.next()
    const securedResponse = applySecurityHeaders(response)
    const csp = securedResponse.headers.get('Content-Security-Policy')

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
```

### 2. CSRFプロテクションテスト（失敗版）

#### テストファイル: `__tests__/security/csrf.test.ts`

```typescript
import { generateToken, verifyToken } from '@/lib/security/csrf'

describe('CSRF Protection', () => {
  test('should generate valid CSRF token', () => {
    // この関数はまだ存在しないため失敗する
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
})
```

### 3. XSS対策テスト（失敗版）

#### テストファイル: `__tests__/security/xss.test.ts`

```typescript
import { sanitizeHtml } from '@/lib/security/xss'

describe('XSS Protection', () => {
  const maliciousPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<div onload="alert(\'XSS\')">content</div>',
    '<a href="javascript:alert(\'XSS\')">click me</a>'
  ]

  test.each(maliciousPayloads)(
    'should sanitize malicious payload: %s',
    (payload) => {
      // この関数はまだ存在しないため失敗する
      const sanitized = sanitizeHtml(payload)
      
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

  test('should handle empty and null inputs safely', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(null as any)).toBe('')
    expect(sanitizeHtml(undefined as any)).toBe('')
  })
})
```

## テスト実行結果と失敗確認

```bash
npm test -- --testPathPattern="security" --verbose
```

### 期待される失敗メッセージ

#### headers.test.ts
```
Cannot find module '@/lib/security/headers'
```

#### csrf.test.ts  
```
Cannot find module '@/lib/security/csrf'
```

#### xss.test.ts
```
Cannot find module '@/lib/security/xss'
```

## 失敗理由の確認

✅ **正常にテストが失敗しました**

失敗理由：
1. **セキュリティモジュールが存在しない**: `/lib/security/headers`, `/lib/security/csrf`, `/lib/security/xss`
2. **セキュリティ関数が未実装**: `applySecurityHeaders`, `generateToken`, `verifyToken`, `sanitizeHtml`
3. **セキュリティ定数が未定義**: `SECURITY_HEADERS`

これらの失敗は、まだセキュリティ機能が実装されていないことを正しく示しており、次のGreen Phaseで実装すべき機能が明確になりました。

## 次のGreen Phase での実装予定

1. **`lib/security/headers.ts`**: セキュリティヘッダー管理
2. **`lib/security/csrf.ts`**: CSRFトークン生成・検証  
3. **`lib/security/xss.ts`**: XSS対策とサニタイゼーション
4. **必要な依存関係**: `isomorphic-dompurify`, `crypto`モジュール等