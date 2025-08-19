import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) {
		redirect("/auth/login");
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">本棚</h1>
						<p className="text-gray-600 mt-2">
							ユーザー: <span className="font-medium">{data.user.email}</span>
						</p>
					</div>
					<LogoutButton />
				</div>
			</div>
		</div>
	);
}
