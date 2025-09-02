export class DuplicateHandler {
	checkBookDuplicate(newBook: any, existingBooks: any[]): boolean {
		// 最小実装: ISBN13による重複チェック
		if (!newBook.isbn13) {
			return false;
		}

		return existingBooks.some((book) => book.isbn13 === newBook.isbn13);
	}

	calculateBookSimilarity(book1: any, book2: any): number {
		// 最小実装: タイトルと著者による類似度判定
		const title1 = book1.title?.toLowerCase() || "";
		const title2 = book2.title?.toLowerCase() || "";

		const author1 = book1.authors?.[0]?.toLowerCase() || "";
		const author2 = book2.authors?.[0]?.toLowerCase() || "";

		// 簡単な文字列マッチング
		const titleMatch = this.calculateStringSimilarity(title1, title2);
		const authorMatch = this.calculateStringSimilarity(author1, author2);

		// 重み付き平均
		return titleMatch * 0.7 + authorMatch * 0.3;
	}

	mergeBookData(existingBook: any, newBook: any): any {
		// 最小実装: より新しい/完全なデータを優先
		const filteredNewBook = Object.fromEntries(
			Object.entries(newBook).filter(
				([key, value]) =>
					value !== undefined && value !== null && value !== ""
			)
		);

		return {
			...existingBook,
			...filteredNewBook,
			// 特別な処理が必要なフィールド
			rating:
				newBook.rating !== undefined ? newBook.rating : existingBook.rating,
			review: newBook.review || existingBook.review,
			currentPage: Math.max(
				newBook.currentPage || 0,
				existingBook.currentPage || 0
			)
		};
	}

	private calculateStringSimilarity(str1: string, str2: string): number {
		// 最小実装: 簡単な類似度計算
		if (str1 === str2) return 1.0;

		// 正規化（大文字小文字、スペースを統一）
		const normalized1 = str1.replace(/\s+/g, " ").trim();
		const normalized2 = str2.replace(/\s+/g, " ").trim();

		if (normalized1 === normalized2) return 0.95;

		// 部分一致チェック
		if (
			normalized1.includes(normalized2) ||
			normalized2.includes(normalized1)
		) {
			return 0.8;
		}

		// レーベンシュタイン距離の簡易版
		const distance = this.levenshteinDistance(normalized1, normalized2);
		const maxLength = Math.max(normalized1.length, normalized2.length);

		if (maxLength === 0) return 1.0;

		return Math.max(0, 1 - distance / maxLength);
	}

	private levenshteinDistance(str1: string, str2: string): number {
		// 最小実装: 簡易版レーベンシュタイン距離
		const matrix = Array(str2.length + 1)
			.fill(null)
			.map(() => Array(str1.length + 1).fill(null));

		for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
		for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

		for (let j = 1; j <= str2.length; j++) {
			for (let i = 1; i <= str1.length; i++) {
				const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
				matrix[j][i] = Math.min(
					matrix[j][i - 1] + 1, // deletion
					matrix[j - 1][i] + 1, // insertion
					matrix[j - 1][i - 1] + indicator // substitution
				);
			}
		}

		return matrix[str2.length][str1.length];
	}
}
