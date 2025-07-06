import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const { id } = await params;
		const book = await prisma.book.findUnique({
			where: { id },
			include: {
				userBooks: {
					where: { userId: session.user.id },
				},
			},
		});

		if (!book) {
			return NextResponse.json(
				{ error: "書籍が見つかりません" },
				{ status: 404 },
			);
		}

		return NextResponse.json(book);
	} catch (error) {
		console.error("Book GET error:", error);
		return NextResponse.json(
			{ error: "書籍の取得に失敗しました" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();

		const book = await prisma.book.update({
			where: { id },
			data: body,
		});

		return NextResponse.json(book);
	} catch (error) {
		console.error("Book PUT error:", error);
		return NextResponse.json(
			{ error: "書籍の更新に失敗しました" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const { id } = await params;

		await prisma.book.delete({
			where: { id },
		});

		return NextResponse.json({ message: "書籍が削除されました" });
	} catch (error) {
		console.error("Book DELETE error:", error);
		return NextResponse.json(
			{ error: "書籍の削除に失敗しました" },
			{ status: 500 },
		);
	}
}
