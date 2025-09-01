import { render, screen } from "@testing-library/react";
import { BookCard } from "@/components/library/BookCard";
import { BookStatus } from "@/lib/models/book";

describe("Image Optimization Tests", () => {
	const mockBook = {
		id: "1",
		book: {
			id: "book-1",
			title: "Test Book",
			authors: ["Test Author"],
			thumbnailUrl: "https://example.com/cover.jpg",
			pageCount: 300,
		},
		status: BookStatus.READING,
		currentPage: 150,
		userId: "user-1",
		addedAt: new Date(),
		updatedAt: new Date(),
	};

	// このテストは失敗するはず（現在は img タグを使用）
	it("should use Next.js Image component instead of img tag", () => {
		render(
			<BookCard book={mockBook} onStatusChange={() => {}} onRemove={() => {}} />
		);

		const imageElement = screen.getByRole("img");
		// Next.js Image コンポーネントの特徴をテスト
		expect(imageElement).toHaveAttribute("loading", "lazy");
		expect(imageElement).toHaveAttribute("sizes");
	});

	it("should have optimized image sizes defined", () => {
		render(
			<BookCard book={mockBook} onStatusChange={() => {}} onRemove={() => {}} />
		);

		const imageElement = screen.getByRole("img");
		expect(imageElement).toHaveAttribute(
			"sizes",
			"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
		);
	});
});
