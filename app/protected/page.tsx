import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { LibraryApp } from "@/components/library/LibraryApp";

export default async function ProtectedPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) {
		redirect("/auth/login");
	}

	return (
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
						<LogoutButton />
					</div>
				</div>
			</header>

			{/* メインアプリケーション */}
			<LibraryApp />
		</div>
	);
}
