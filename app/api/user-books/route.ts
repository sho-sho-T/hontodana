import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const status = searchParams.get("status");
		const format = searchParams.get("format");

		const where = {
			userId: session.user.id,
			...(status && { readingStatus: status as any }),
			...(format && { bookFormat: format as any }),
		};

		const [userBooks, total] = await Promise.all([
			prisma.userBook.findMany({
				where,
				include: {
					book: true,
				},
				skip: (page - 1) * limit,
				take: limit,
				orderBy: { updatedAt: "desc" },
			}),
			prisma.userBook.count({ where }),
		]);

		return NextResponse.json({
			userBooks,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (error) {
		console.error("UserBooks GET error:", error);
		return NextResponse.json(
			{ error: "ユーザー書籍の取得に失敗しました" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const body = await request.json();
		const {
			bookId,
			bookFormat,
			readingStatus,
			currentPage,
			totalPages,
			rating,
			notes,
			favorite,
			startedAt,
			completedAt,
		} = body;

		const userBook = await prisma.userBook.create({
			data: {
				userId: session.user.id,
				bookId,
				bookFormat,
				readingStatus,
				currentPage,
				totalPages,
				rating,
				notes,
				favorite,
				startedAt: startedAt ? new Date(startedAt) : null,
				completedAt: completedAt ? new Date(completedAt) : null,
			},
			include: {
				book: true,
			},
		});

		return NextResponse.json(userBook, { status: 201 });
	} catch (error) {
		console.error("UserBooks POST error:", error);
		return NextResponse.json(
			{ error: "ユーザー書籍の作成に失敗しました" },
			{ status: 500 },
		);
	}
}
