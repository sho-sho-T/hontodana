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
		<div className="flex h-svh w-full items-center justify-center gap-2">
			<p>
				Hello <span>{data.user.email}</span>
			</p>
			<LogoutButton />
		</div>
	);
}
