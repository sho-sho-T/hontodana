import { redirect } from "next/navigation";

export default function ProtectedPage() {
	// Redirect to dashboard by default
	redirect("/protected/dashboard");
}
