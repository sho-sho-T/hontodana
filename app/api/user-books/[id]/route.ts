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
		const userBook = await prisma.userBook.findUnique({
			where: { id },
			include: {
				book: true,
				readingLogs: {
					orderBy: { createdAt: "desc" },
					take: 10,
				},
			},
		});

		if (!userBook || userBook.userId !== session.user.id) {
			return NextResponse.json(
				{ error: "ユーザー書籍が見つかりません" },
				{ status: 404 },
			);
		}

		return NextResponse.json(userBook);
	} catch (error) {
		console.error("UserBook GET error:", error);
		return NextResponse.json(
			{ error: "ユーザー書籍の取得に失敗しました" },
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

		const existingUserBook = await prisma.userBook.findUnique({
			where: { id },
		});

		if (!existingUserBook || existingUserBook.userId !== session.user.id) {
			return NextResponse.json(
				{ error: "ユーザー書籍が見つかりません" },
				{ status: 404 },
			);
		}

		const updateData = {
			...body,
			...(body.startedAt && { startedAt: new Date(body.startedAt) }),
			...(body.completedAt && { completedAt: new Date(body.completedAt) }),
		};

		const userBook = await prisma.userBook.update({
			where: { id },
			data: updateData,
			include: {
				book: true,
			},
		});

		return NextResponse.json(userBook);
	} catch (error) {
		console.error("UserBook PUT error:", error);
		return NextResponse.json(
			{ error: "ユーザー書籍の更新に失敗しました" },
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

		const existingUserBook = await prisma.userBook.findUnique({
			where: { id },
		});

		if (!existingUserBook || existingUserBook.userId !== session.user.id) {
			return NextResponse.json(
				{ error: "ユーザー書籍が見つかりません" },
				{ status: 404 },
			);
		}

		await prisma.userBook.delete({
			where: { id },
		});

		return NextResponse.json({ message: "ユーザー書籍が削除されました" });
	} catch (error) {
		console.error("UserBook DELETE error:", error);
		return NextResponse.json(
			{ error: "ユーザー書籍の削除に失敗しました" },
			{ status: 500 },
		);
	}
}
