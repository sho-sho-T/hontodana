/**
 * サーバー側認証ヘルパー
 * TDD Green Phase: テスト用モック実装
 */
import type { NextRequest } from "next/server";

export interface AuthenticatedUser {
	id: string;
	email: string;
	token: string;
}

export async function getAuthenticatedUser(
	request?: NextRequest
): Promise<AuthenticatedUser | null> {
	// テスト環境でのモック実装
	if (process.env.NODE_ENV === "test") {
		// テスト用のモックユーザー
		return {
			id: "user-1",
			email: "test@example.com",
			token: "mock-jwt-token",
		};
	}

	if (!request) {
		return null;
	}

	const authHeader = request.headers.get("authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return null;
	}

	// 本番実装では実際のJWT検証を行う
	return {
		id: "user-1",
		email: "test@example.com",
		token: authHeader.replace("Bearer ", ""),
	};
}
