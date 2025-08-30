import { SECURITY_HEADERS } from '@/lib/security/headers'

// Mock NextResponse for testing
const mockNextResponse = {
  headers: new Map<string, string>(),
  set: function(key: string, value: string) {
    this.headers.set(key, value)
  },
  get: function(key: string) {
    return this.headers.get(key)
  }
}

describe('Security Headers', () => {
  beforeEach(() => {
    mockNextResponse.headers.clear()
  })

  test('should have all required security header constants', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security'])
      .toBe('max-age=63072000; includeSubDomains; preload')
    
    expect(SECURITY_HEADERS['X-Content-Type-Options'])
      .toBe('nosniff')
    
    expect(SECURITY_HEADERS['X-Frame-Options'])
      .toBe('DENY')
    
    expect(SECURITY_HEADERS['Content-Security-Policy'])
      .toContain("default-src 'self'")
  })

  test('should include comprehensive CSP policy', () => {
    const csp = SECURITY_HEADERS['Content-Security-Policy']

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("upgrade-insecure-requests")
  })

  test('should set permissions policy to restrict dangerous features', () => {
    const permissionsPolicy = SECURITY_HEADERS['Permissions-Policy']

    expect(permissionsPolicy).toContain('camera=()')
    expect(permissionsPolicy).toContain('microphone=()')
    expect(permissionsPolicy).toContain('geolocation=()')
  })
})