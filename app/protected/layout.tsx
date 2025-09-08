import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "./components/Navigation";
import { LibraryProvider } from "./components/LibraryProvider";
import Link from "next/link";

export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) {
		redirect("/auth/login");
	}

	return (
		<LibraryProvider>
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				{/* ヘッダー */}
				<header className="bg-white dark:bg-gray-800 shadow-sm border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
									📚 本棚アプリ
								</h1>
								<p className="text-gray-600 dark:text-gray-400 mt-2">
									ユーザー: <span className="font-medium">{data.user.email}</span>
								</p>
							</div>
							<div className="flex items-center gap-4">
								<Link
									href="/profile"
									className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
								>
									👤 プロフィール
								</Link>
								<LogoutButton />
							</div>
						</div>
					</div>
				</header>

				{/* ナビゲーション */}
				<Navigation />

				{/* メインコンテンツ */}
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{children}
				</main>
			</div>
		</LibraryProvider>
	);
}