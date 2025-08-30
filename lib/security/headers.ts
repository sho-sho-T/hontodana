import type { NextResponse } from "next/server";

// セキュリティヘッダー定数
export const SECURITY_HEADERS = {
	// HTTPS強制
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

	// XSS防止
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "1; mode=block",

	// リファラー制御
	"Referrer-Policy": "strict-origin-when-cross-origin",

	// 権限制御
	"Permissions-Policy": [
		"camera=()",
		"microphone=()",
		"geolocation=()",
		"payment=()",
		"usb=()",
		"magnetometer=()",
		"gyroscope=()",
		"accelerometer=()",
	].join(", "),

	// CSP (Content Security Policy)
	"Content-Security-Policy": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https: blob:",
		"font-src 'self' data:",
		"connect-src 'self' https://*.supabase.co https://books.googleapis.com",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"upgrade-insecure-requests",
	].join("; "),
} as const;

/**
 * セキュリティヘッダーをレスポンスに適用
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
	Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}
