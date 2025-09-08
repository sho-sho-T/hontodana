"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
	const pathname = usePathname();

	const navItems = [
		{
			href: "/protected/dashboard",
			label: "📊 ダッシュボード",
			key: "dashboard",
		},
		{
			href: "/protected/search",
			label: "🔍 書籍検索",
			key: "search",
		},
		{
			href: "/protected/library",
			label: "📚 マイライブラリ",
			key: "library",
		},
		{
			href: "/protected/wishlist",
			label: "💝 ウィッシュリスト",
			key: "wishlist",
		},
	];

	return (
		<nav className="bg-gray-100 dark:bg-gray-800 border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex space-x-2 p-1">
					{navItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.key}
								href={item.href}
								className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors text-center ${
									isActive
										? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
										: "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
								}`}
							>
								{item.label}
							</Link>
						);
					})}
				</div>
			</div>
		</nav>
	);
}