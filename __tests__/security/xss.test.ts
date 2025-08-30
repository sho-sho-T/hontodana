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