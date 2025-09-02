import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { NotificationProvider } from "@/components/providers/notification-provider";
import { ErrorBoundary } from "@/components/errors/error-boundary";
import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { AuthProvider } from "@/components/providers/auth-provider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "hontodana - 書籍管理",
	description: "あなたの本棚をデジタルで管理するWebアプリケーション",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja" suppressHydrationWarning={true}>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ErrorBoundary fallbackMessage="アプリケーションでエラーが発生しました">
					<AuthProvider>
						<OfflineNotice />
						{children}
					</AuthProvider>
				</ErrorBoundary>
			</body>
		</html>
	);
}
