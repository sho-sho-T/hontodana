import { createHmac, randomBytes } from "node:crypto";

// CSRFトークンの有効期限（1時間）
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000;

// CSRF署名用のシークレット（本番環境では環境変数から取得）
const CSRF_SECRET =
	process.env.CSRF_SECRET || "default-csrf-secret-change-in-production";

/**
 * CSRFトークンを生成
 */
export function generateToken(): string {
	const timestamp = Date.now();
	const randomValue = randomBytes(16).toString("hex");

	// タイムスタンプとランダム値を組み合わせ
	const payload = `${timestamp}:${randomValue}`;

	// HMAC署名を生成
	const signature = createHmac("sha256", CSRF_SECRET)
		.update(payload)
		.digest("hex");

	return `${payload}:${signature}`;
}

/**
 * CSRFトークンを検証
 */
export function verifyToken(token: string): boolean {
	if (!token || typeof token !== "string") {
		return false;
	}

	try {
		const parts = token.split(":");
		if (parts.length !== 3) {
			return false;
		}

		const [timestampStr, randomValue, signature] = parts;
		const timestamp = Number.parseInt(timestampStr, 10);

		// タイムスタンプの妥当性確認
		if (Number.isNaN(timestamp)) {
			return false;
		}

		// 有効期限チェック
		if (Date.now() - timestamp > CSRF_TOKEN_EXPIRY) {
			return false;
		}

		// 署名検証
		const payload = `${timestamp}:${randomValue}`;
		const expectedSignature = createHmac("sha256", CSRF_SECRET)
			.update(payload)
			.digest("hex");

		return signature === expectedSignature;
	} catch {
		return false;
	}
}

/**
 * CSRFエラークラス
 */
export class CSRFError extends Error {
	constructor(message = "Invalid CSRF token") {
		super(message);
		this.name = "CSRFError";
	}
}
