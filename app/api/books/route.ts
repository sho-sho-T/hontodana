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
		const search = searchParams.get("search");
		const category = searchParams.get("category");

		const where = {
			...(search && {
				OR: [
					{ title: { contains: search, mode: "insensitive" as const } },
					{ author: { contains: search, mode: "insensitive" as const } },
				],
			}),
			...(category && { categories: { has: category } }),
		};

		const [books, total] = await Promise.all([
			prisma.book.findMany({
				where,
				skip: (page - 1) * limit,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.book.count({ where }),
		]);

		return NextResponse.json({
			books,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (error) {
		console.error("Books GET error:", error);
		return NextResponse.json(
			{ error: "書籍の取得に失敗しました" },
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
			title,
			author,
			isbn,
			isbn13,
			googleBooksId,
			description,
			publisher,
			publishedDate,
			pageCount,
			language,
			categories,
			averageRating,
			ratingsCount,
			thumbnail,
			smallThumbnail,
			previewLink,
			infoLink,
			canonicalVolumeLink,
		} = body;

		const book = await prisma.book.create({
			data: {
				title,
				author,
				isbn,
				isbn13,
				googleBooksId,
				description,
				publisher,
				publishedDate,
				pageCount,
				language,
				categories: categories || [],
				averageRating,
				ratingsCount,
				thumbnail,
				smallThumbnail,
				previewLink,
				infoLink,
				canonicalVolumeLink,
			},
		});

		return NextResponse.json(book, { status: 201 });
	} catch (error) {
		console.error("Books POST error:", error);
		return NextResponse.json(
			{ error: "書籍の作成に失敗しました" },
			{ status: 500 },
		);
	}
}
