import DOMPurify from "isomorphic-dompurify";

/**
 * HTML文字列をサニタイズしてXSS攻撃を防ぐ
 */
export function sanitizeHtml(dirty: string): string {
	// 空値やnull/undefinedの処理
	if (!dirty || typeof dirty !== "string") {
		return "";
	}

	// 文字数制限（DoS攻撃対策）
	if (dirty.length > 50000) {
		// 50KB制限
		const trimmed = dirty.substring(0, 50000);

		return DOMPurify.sanitize(trimmed, {
			// 許可するHTMLタグ
			ALLOWED_TAGS: [
				"p",
				"br",
				"strong",
				"em",
				"b",
				"i",
				"u",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"ul",
				"ol",
				"li",
				"blockquote",
				"code",
				"pre",
			],

			// 許可する属性（最小限）
			ALLOWED_ATTR: ["class"],

			// 危険な要素を確実に削除
			FORBID_TAGS: [
				"script",
				"iframe",
				"object",
				"embed",
				"form",
				"input",
				"textarea",
				"button",
				"select",
				"option",
				"style",
				"link",
				"meta",
				"base",
			],

			// 危険な属性を削除
			FORBID_ATTR: [
				"onclick",
				"onload",
				"onerror",
				"onmouseover",
				"onfocus",
				"onblur",
				"onchange",
				"onsubmit",
				"style",
				"href",
				"src",
				"action",
				"formaction",
			],

			// プロトコルのホワイトリスト
			ALLOWED_URI_REGEXP:
				/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,

			// その他のセキュリティ設定
			KEEP_CONTENT: true,
			RETURN_DOM: false,
			RETURN_DOM_FRAGMENT: false,
			SANITIZE_DOM: true,
		});
	}

	return DOMPurify.sanitize(dirty, {
		// 許可するHTMLタグ
		ALLOWED_TAGS: [
			"p",
			"br",
			"strong",
			"em",
			"b",
			"i",
			"u",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"ul",
			"ol",
			"li",
			"blockquote",
			"code",
			"pre",
		],

		// 許可する属性（最小限）
		ALLOWED_ATTR: ["class"],

		// 危険な要素を確実に削除
		FORBID_TAGS: [
			"script",
			"iframe",
			"object",
			"embed",
			"form",
			"input",
			"textarea",
			"button",
			"select",
			"option",
			"style",
			"link",
			"meta",
			"base",
		],

		// 危険な属性を削除
		FORBID_ATTR: [
			"onclick",
			"onload",
			"onerror",
			"onmouseover",
			"onfocus",
			"onblur",
			"onchange",
			"onsubmit",
			"style",
			"href",
			"src",
			"action",
			"formaction",
		],

		// プロトコルのホワイトリスト
		ALLOWED_URI_REGEXP:
			/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,

		// その他のセキュリティ設定
		KEEP_CONTENT: true,
		RETURN_DOM: false,
		RETURN_DOM_FRAGMENT: false,
		SANITIZE_DOM: true,
	});
}

/**
 * プレーンテキストとして出力（HTMLタグを完全に除去）
 */
export function sanitizeText(dirty: string): string {
	if (!dirty || typeof dirty !== "string") {
		return "";
	}

	// HTMLタグを完全に削除
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
		KEEP_CONTENT: true,
	});
}

/**
 * 危険なパターンを検出
 */
export function detectMaliciousPatterns(input: string): {
	isValid: boolean;
	threats: string[];
} {
	if (!input || typeof input !== "string") {
		return { isValid: true, threats: [] };
	}

	const threats: string[] = [];

	// JavaScript実行パターン
	if (/javascript:/i.test(input)) {
		threats.push("javascript_protocol");
	}

	// スクリプトタグ
	if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input)) {
		threats.push("script_tag");
	}

	// イベントハンドラー
	if (/\bon\w+\s*=/i.test(input)) {
		threats.push("event_handler");
	}

	// データURL（Base64エンコードされた悪意のあるコード）
	if (/data:\s*[^;]+;base64/i.test(input)) {
		threats.push("data_uri");
	}

	// 危険なタグ
	const dangerousTags =
		/<(script|iframe|object|embed|form|input|meta|link)\b/gi;
	if (dangerousTags.test(input)) {
		threats.push("dangerous_tag");
	}

	return {
		isValid: threats.length === 0,
		threats,
	};
}
