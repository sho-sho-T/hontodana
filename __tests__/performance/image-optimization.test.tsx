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

	it("should use optimized image attributes", () => {
		render(
			<BookCard book={mockBook} onStatusChange={() => {}} onRemove={() => {}} />
		);

		const imageElement = screen.getByRole("img");
		// 画像最適化の基本属性をテスト
		expect(imageElement).toHaveAttribute("alt");
		expect(imageElement).toHaveAttribute("sizes");
		expect(imageElement).toHaveClass("object-cover");
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
