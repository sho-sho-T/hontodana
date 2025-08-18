import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// 実験的機能の設定
	experimental: {
		// パッケージのインポートを最適化してバンドルサイズを削減
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},
	
	// 画像最適化の設定
	images: {
		// 外部画像ソースの許可設定（Google Books APIからの書影取得用）
		remotePatterns: [
			{
				protocol: "https",
				hostname: "books.google.com",
				port: "",
				pathname: "/books/**", // Google Books APIの書影URL
			},
			{
				protocol: "https",
				hostname: "example.com",
				port: "",
				pathname: "/**", // テスト用の画像URL
			},
			{
				protocol: "https",
				hostname: "via.placeholder.com",
				port: "",
				pathname: "/**", // プレースホルダー画像URL
			},
		],
	},
	
	// TypeScript設定
	typescript: {
		// 型チェックエラーがあってもビルドを継続（開発時の利便性向上）
		ignoreBuildErrors: false,
	},
	
	// ESLint設定（Biomeを使用するため無効化）
	eslint: {
		ignoreDuringBuilds: true, // BiomeでLintingを行うためESLintは無効
	},
};

export default nextConfig;
