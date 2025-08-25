# TASK-204: 評価・レビュー機能 - テストケース

## Server Actions テストケース

### 1. updateBookRating テスト

#### 1.1 正常系テスト
```javascript
describe('updateBookRating', () => {
  test('should update book rating with valid value', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const rating = 4;
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      bookId: 'book-123',
      rating: null,
    };

    const updatedUserBook = {
      ...mockUserBook,
      rating: 4,
      updatedAt: new Date(),
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookRating(userBookId, rating);

    expect(result.success).toBe(true);
    expect(result.data.rating).toBe(4);
    expect(prismaMock.userBook.update).toHaveBeenCalledWith({
      where: { id: userBookId },
      data: { rating: 4 },
    });
  });

  test('should clear book rating with null value', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const rating = null;
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      rating: 3,
    };

    const updatedUserBook = {
      ...mockUserBook,
      rating: null,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookRating(userBookId, rating);

    expect(result.success).toBe(true);
    expect(result.data.rating).toBeNull();
  });

  test('should update rating for all valid values 1-5', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      rating: null,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);

    for (const rating of [1, 2, 3, 4, 5]) {
      const updatedUserBook = { ...mockUserBook, rating };
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

      const result = await updateBookRating(userBookId, rating);

      expect(result.success).toBe(true);
      expect(result.data.rating).toBe(rating);
    }
  });
});
```

#### 1.2 異常系テスト
```javascript
describe('updateBookRating - error cases', () => {
  test('should fail with invalid rating value', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    
    // 範囲外の値をテスト
    const invalidRatings = [0, 6, -1, 10, 3.5];
    
    for (const rating of invalidRatings) {
      const result = await updateBookRating(userBookId, rating);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('評価は1-5の整数値');
    }
  });

  test('should fail with non-existent userBook', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const rating = 4;

    prismaMock.userBook.findUnique.mockResolvedValue(null);

    const result = await updateBookRating(userBookId, rating);

    expect(result.success).toBe(false);
    expect(result.error).toContain('書籍が見つかりません');
  });

  test('should fail when user is not owner', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const rating = 4;

    const mockUserBook = {
      id: userBookId,
      userId: 'other-user-456',
      rating: null,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);

    const result = await updateBookRating(userBookId, rating);

    expect(result.success).toBe(false);
    expect(result.error).toContain('権限がありません');
  });

  test('should fail with invalid UUID format', async () => {
    const userBookId = 'invalid-uuid';
    const rating = 4;

    const result = await updateBookRating(userBookId, rating);

    expect(result.success).toBe(false);
    expect(result.error).toContain('無効な書籍ID');
  });
});
```

### 2. updateBookReview テスト

#### 2.1 正常系テスト
```javascript
describe('updateBookReview', () => {
  test('should update book review with valid text', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const review = '素晴らしい本でした。特に第3章の内容が印象的で、著者の深い洞察に感動しました。';
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      review: null,
    };

    const updatedUserBook = {
      ...mockUserBook,
      review,
      updatedAt: new Date(),
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookReview(userBookId, review);

    expect(result.success).toBe(true);
    expect(result.data.review).toBe(review);
  });

  test('should clear book review with null value', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const review = null;
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      review: '既存のレビュー',
    };

    const updatedUserBook = {
      ...mockUserBook,
      review: null,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookReview(userBookId, review);

    expect(result.success).toBe(true);
    expect(result.data.review).toBeNull();
  });

  test('should handle empty string review', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const review = '';
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      review: null,
    };

    const updatedUserBook = {
      ...mockUserBook,
      review: null, // 空文字列はnullに変換
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookReview(userBookId, review);

    expect(result.success).toBe(true);
    expect(result.data.review).toBeNull();
  });

  test('should handle review with maximum length', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const review = 'a'.repeat(2000); // 最大文字数
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      review: null,
    };

    const updatedUserBook = {
      ...mockUserBook,
      review,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookReview(userBookId, review);

    expect(result.success).toBe(true);
    expect(result.data.review).toBe(review);
  });
});
```

#### 2.2 異常系テスト
```javascript
describe('updateBookReview - error cases', () => {
  test('should fail with review exceeding maximum length', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const review = 'a'.repeat(2001); // 最大文字数超過

    const result = await updateBookReview(userBookId, review);

    expect(result.success).toBe(false);
    expect(result.error).toContain('2000文字以下');
  });

  test('should fail with non-existent userBook', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const review = 'テストレビュー';

    prismaMock.userBook.findUnique.mockResolvedValue(null);

    const result = await updateBookReview(userBookId, review);

    expect(result.success).toBe(false);
    expect(result.error).toContain('書籍が見つかりません');
  });

  test('should fail when user is not owner', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const review = 'テストレビュー';

    const mockUserBook = {
      id: userBookId,
      userId: 'other-user-456',
      review: null,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);

    const result = await updateBookReview(userBookId, review);

    expect(result.success).toBe(false);
    expect(result.error).toContain('権限がありません');
  });
});
```

### 3. updateBookRatingAndReview テスト

#### 3.1 正常系テスト
```javascript
describe('updateBookRatingAndReview', () => {
  test('should update both rating and review simultaneously', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const rating = 5;
    const review = '最高の一冊でした！';
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      rating: null,
      review: null,
    };

    const updatedUserBook = {
      ...mockUserBook,
      rating,
      review,
      updatedAt: new Date(),
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookRatingAndReview(userBookId, rating, review);

    expect(result.success).toBe(true);
    expect(result.data.rating).toBe(rating);
    expect(result.data.review).toBe(review);
    expect(prismaMock.userBook.update).toHaveBeenCalledWith({
      where: { id: userBookId },
      data: { rating, review },
    });
  });

  test('should handle partial updates (rating only)', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const rating = 3;
    const review = null;
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      rating: null,
      review: '既存のレビュー',
    };

    const updatedUserBook = {
      ...mockUserBook,
      rating,
      review, // nullに更新
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookRatingAndReview(userBookId, rating, review);

    expect(result.success).toBe(true);
    expect(result.data.rating).toBe(rating);
    expect(result.data.review).toBeNull();
  });

  test('should handle partial updates (review only)', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const rating = null;
    const review = '新しいレビュー';
    
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      rating: 4,
      review: null,
    };

    const updatedUserBook = {
      ...mockUserBook,
      rating, // nullに更新
      review,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);
    prismaMock.userBook.update.mockResolvedValue(updatedUserBook);

    const result = await updateBookRatingAndReview(userBookId, rating, review);

    expect(result.success).toBe(true);
    expect(result.data.rating).toBeNull();
    expect(result.data.review).toBe(review);
  });
});
```

### 4. getUserRatingStats テスト

#### 4.1 正常系テスト
```javascript
describe('getUserRatingStats', () => {
  test('should calculate rating statistics correctly', async () => {
    const mockUserBooks = [
      { rating: 5, review: 'Great!' },
      { rating: 4, review: null },
      { rating: 4, review: 'Good' },
      { rating: 3, review: null },
      { rating: 5, review: 'Amazing' },
      { rating: null, review: 'No rating' }, // 統計から除外
    ];

    prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks);

    const result = await getUserRatingStats();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      averageRating: 4.2, // (5+4+4+3+5)/5 = 4.2
      totalRated: 5,
      totalBooks: 6,
      distribution: {
        1: 0,
        2: 0,
        3: 1,
        4: 2,
        5: 2,
      },
      reviewsCount: 3, // レビューあり
    });
  });

  test('should handle no rated books', async () => {
    const mockUserBooks = [
      { rating: null, review: null },
      { rating: null, review: 'Review only' },
    ];

    prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks);

    const result = await getUserRatingStats();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      averageRating: null,
      totalRated: 0,
      totalBooks: 2,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      reviewsCount: 1,
    });
  });

  test('should handle empty book list', async () => {
    prismaMock.userBook.findMany.mockResolvedValue([]);

    const result = await getUserRatingStats();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      averageRating: null,
      totalRated: 0,
      totalBooks: 0,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      reviewsCount: 0,
    });
  });
});
```

### 5. getBooksWithRatings テスト

#### 5.1 正常系テスト
```javascript
describe('getBooksWithRatings', () => {
  test('should return books with ratings and reviews', async () => {
    const mockUserBooks = [
      {
        id: 'ub-1',
        rating: 5,
        review: 'Excellent book!',
        updatedAt: new Date('2024-01-15'),
        book: {
          id: 'book-1',
          title: 'Test Book 1',
          authors: ['Author 1'],
          thumbnailUrl: 'http://example.com/thumb1.jpg',
        },
      },
      {
        id: 'ub-2',
        rating: 3,
        review: null,
        updatedAt: new Date('2024-01-10'),
        book: {
          id: 'book-2',
          title: 'Test Book 2',
          authors: ['Author 2'],
          thumbnailUrl: null,
        },
      },
    ];

    prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks);

    const result = await getBooksWithRatings();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      userBookId: 'ub-1',
      rating: 5,
      review: 'Excellent book!',
      reviewDate: new Date('2024-01-15'),
      book: {
        id: 'book-1',
        title: 'Test Book 1',
        authors: ['Author 1'],
        thumbnailUrl: 'http://example.com/thumb1.jpg',
      },
    });
  });

  test('should filter by rating', async () => {
    const mockUserBooks = [
      { id: 'ub-1', rating: 5, book: { title: 'Book 1' } },
      { id: 'ub-2', rating: 4, book: { title: 'Book 2' } },
    ];

    prismaMock.userBook.findMany.mockResolvedValue([mockUserBooks[0]]);

    const result = await getBooksWithRatings({ rating: 5 });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].rating).toBe(5);
    expect(prismaMock.userBook.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', rating: 5 },
      include: { book: expect.any(Object) },
      orderBy: { updatedAt: 'desc' },
    });
  });

  test('should filter by hasReview', async () => {
    const mockUserBooks = [
      { id: 'ub-1', rating: 5, review: 'Great!', book: { title: 'Book 1' } },
    ];

    prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks);

    const result = await getBooksWithRatings({ hasReview: true });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(prismaMock.userBook.findMany).toHaveBeenCalledWith({
      where: { 
        userId: 'user-123', 
        review: { not: null },
      },
      include: { book: expect.any(Object) },
      orderBy: { updatedAt: 'desc' },
    });
  });
});
```

## UI コンポーネントテストケース

### 1. StarRating テスト

#### 1.1 レンダリングテスト
```javascript
describe('StarRating', () => {
  test('should render correct number of stars', () => {
    render(<StarRating value={3} onChange={jest.fn()} />);
    
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  test('should highlight correct stars based on value', () => {
    render(<StarRating value={3} onChange={jest.fn()} />);
    
    const stars = screen.getAllByRole('button');
    
    // 最初の3つの星が選択されている
    expect(stars[0]).toHaveClass('filled');
    expect(stars[1]).toHaveClass('filled');
    expect(stars[2]).toHaveClass('filled');
    expect(stars[3]).not.toHaveClass('filled');
    expect(stars[4]).not.toHaveClass('filled');
  });

  test('should render no stars when value is null', () => {
    render(<StarRating value={null} onChange={jest.fn()} />);
    
    const stars = screen.getAllByRole('button');
    stars.forEach(star => {
      expect(star).not.toHaveClass('filled');
    });
  });

  test('should render readonly stars correctly', () => {
    render(<StarRating value={4} onChange={jest.fn()} readonly />);
    
    const stars = screen.getAllByRole('img'); // readonlyの場合はimg
    expect(stars).toHaveLength(5);
    expect(stars[0]).toHaveClass('filled');
  });
});
```

#### 1.2 インタラクションテスト
```javascript
describe('StarRating - interactions', () => {
  test('should call onChange when star is clicked', async () => {
    const handleChange = jest.fn();
    render(<StarRating value={null} onChange={handleChange} />);
    
    const stars = screen.getAllByRole('button');
    
    await user.click(stars[3]); // 4番目の星をクリック
    
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  test('should show hover preview', async () => {
    render(<StarRating value={2} onChange={jest.fn()} />);
    
    const stars = screen.getAllByRole('button');
    
    await user.hover(stars[4]); // 5番目の星にホバー
    
    // 1-5番目の星がプレビュー状態
    for (let i = 0; i < 5; i++) {
      expect(stars[i]).toHaveClass('preview');
    }
  });

  test('should handle keyboard navigation', async () => {
    const handleChange = jest.fn();
    render(<StarRating value={null} onChange={handleChange} />);
    
    const firstStar = screen.getAllByRole('button')[0];
    firstStar.focus();
    
    await user.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  test('should show clear button when showClearButton is true', () => {
    render(
      <StarRating 
        value={3} 
        onChange={jest.fn()} 
        showClearButton 
      />
    );
    
    expect(screen.getByLabelText('評価をクリア')).toBeInTheDocument();
  });

  test('should clear rating when clear button is clicked', async () => {
    const handleChange = jest.fn();
    render(
      <StarRating 
        value={3} 
        onChange={handleChange} 
        showClearButton 
      />
    );
    
    await user.click(screen.getByLabelText('評価をクリア'));
    
    expect(handleChange).toHaveBeenCalledWith(null);
  });
});
```

### 2. ReviewEditor テスト

#### 2.1 レンダリングテスト
```javascript
describe('ReviewEditor', () => {
  test('should render textarea with placeholder', () => {
    render(
      <ReviewEditor 
        value={null}
        onChange={jest.fn()}
        placeholder="レビューを書く"
      />
    );
    
    expect(screen.getByPlaceholderText('レビューを書く')).toBeInTheDocument();
  });

  test('should show character count', () => {
    render(
      <ReviewEditor 
        value="テストレビュー"
        onChange={jest.fn()}
        maxLength={2000}
      />
    );
    
    expect(screen.getByText('7/2000')).toBeInTheDocument();
  });

  test('should show current value', () => {
    const review = '素晴らしい本でした';
    render(<ReviewEditor value={review} onChange={jest.fn()} />);
    
    expect(screen.getByDisplayValue(review)).toBeInTheDocument();
  });
});
```

#### 2.2 インタラクションテスト
```javascript
describe('ReviewEditor - interactions', () => {
  test('should call onChange when text is typed', async () => {
    const handleChange = jest.fn();
    render(<ReviewEditor value="" onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'テスト');
    
    expect(handleChange).toHaveBeenLastCalledWith('テスト');
  });

  test('should prevent input when max length is reached', async () => {
    const handleChange = jest.fn();
    const maxValue = 'a'.repeat(10);
    
    render(
      <ReviewEditor 
        value={maxValue}
        onChange={handleChange}
        maxLength={10}
      />
    );
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'x');
    
    // maxLengthを超える入力は制限される
    expect(handleChange).not.toHaveBeenCalledWith(maxValue + 'x');
  });

  test('should auto-save when autoSave is enabled', async () => {
    jest.useFakeTimers();
    const handleChange = jest.fn();
    
    render(
      <ReviewEditor 
        value=""
        onChange={handleChange}
        autoSave
      />
    );
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'テスト');
    
    // デバウンス待機
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(handleChange).toHaveBeenCalledWith('テスト');
    
    jest.useRealTimers();
  });
});
```

## 統合テストケース

### 1. 評価・レビュー管理フロー
```javascript
describe('Rating and Review Management Flow', () => {
  test('should update rating and review for a book', async () => {
    // BookCardをレンダリング
    render(<BookCard book={mockBook} userBook={mockUserBook} />);
    
    // 星評価をクリック
    const stars = screen.getAllByRole('button');
    await user.click(stars[3]); // 4星
    
    // レビューを開く
    await user.click(screen.getByText('レビューを書く'));
    
    // レビューを入力
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '素晴らしい本でした');
    
    // 保存
    await user.click(screen.getByText('保存'));
    
    // Server Actionが正しく呼ばれたか確認
    expect(mockUpdateRatingAndReview).toHaveBeenCalledWith(
      mockUserBook.id,
      4,
      '素晴らしい本でした'
    );
    
    // 保存完了のトースト表示
    expect(screen.getByText('評価・レビューを保存しました')).toBeInTheDocument();
  });

  test('should display rating statistics in dashboard', async () => {
    const mockStats = {
      averageRating: 4.2,
      totalRated: 15,
      distribution: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
      reviewsCount: 10,
    };
    
    mockGetUserRatingStats.mockResolvedValue({ 
      success: true, 
      data: mockStats 
    });
    
    render(<RatingStatsCard />);
    
    await waitFor(() => {
      expect(screen.getByText('平均評価: 4.2')).toBeInTheDocument();
      expect(screen.getByText('評価済み: 15冊')).toBeInTheDocument();
      expect(screen.getByText('レビュー: 10件')).toBeInTheDocument();
    });
  });
});
```

## E2Eテストケース

### 1. 評価・レビュー投稿シナリオ
```javascript
// Playwright E2E テスト
test('Rating and review submission end-to-end', async ({ page }) => {
  await page.goto('/dashboard');
  
  // 本棚に移動
  await page.click('text=本棚');
  
  // 書籍カードを選択
  await page.click('.book-card').first();
  
  // 星評価を設定
  await page.click('.star-rating >> nth=3'); // 4星
  
  // レビューボタンをクリック
  await page.click('button:has-text("レビューを書く")');
  
  // レビュー入力
  await page.fill('[placeholder="この本についてのレビューを書いてください"]', 
    '非常に興味深い内容で、多くの学びがありました。特に第5章の内容が印象的でした。');
  
  // 保存
  await page.click('button:has-text("保存")');
  
  // 成功メッセージの確認
  await expect(page.locator('.toast >> text=評価・レビューを保存しました')).toBeVisible();
  
  // 星評価が表示されることを確認
  await expect(page.locator('.star-rating .filled')).toHaveCount(4);
  
  // レビューが表示されることを確認
  await expect(page.locator('text=非常に興味深い内容で')).toBeVisible();
});
```

### 2. レスポンシブテストシナリオ
```javascript
test('Rating and review on mobile devices', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/library');
  
  // モバイルでの星評価操作
  const starRating = page.locator('.star-rating').first();
  await expect(starRating).toBeVisible();
  
  // タッチで星評価
  await starRating.locator('.star >> nth=4').tap(); // 5星
  
  // モバイル用レビューダイアログ
  await page.tap('button:has-text("レビュー")');
  
  // モバイル最適化されたテキストエリア
  const textarea = page.locator('[role="textbox"]');
  await expect(textarea).toBeVisible();
  await expect(textarea).toHaveCSS('font-size', '16px'); // ズーム防止
  
  // レビュー入力
  await textarea.fill('モバイルからのレビューテスト');
  
  // 保存
  await page.tap('button:has-text("保存")');
  
  // 成功確認
  await expect(page.locator('.toast')).toBeVisible();
});
```

## パフォーマンステストケース

### 1. 大量データでの統計計算
```javascript
describe('Performance Tests', () => {
  test('should calculate rating stats within 3 seconds for 1000 books', async () => {
    // 1000冊のモックデータを生成
    const mockBooks = Array.from({ length: 1000 }, (_, i) => ({
      id: `book-${i}`,
      rating: Math.floor(Math.random() * 5) + 1,
      review: i % 2 === 0 ? `Review ${i}` : null,
    }));

    prismaMock.userBook.findMany.mockResolvedValue(mockBooks);

    const startTime = performance.now();
    
    const result = await getUserRatingStats();
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.success).toBe(true);
    expect(executionTime).toBeLessThan(3000); // 3秒以内
  });

  test('should handle rapid rating updates without race conditions', async () => {
    const userBookId = '550e8400-e29b-41d4-a716-446655440000';
    const mockUserBook = {
      id: userBookId,
      userId: 'user-123',
      rating: null,
    };

    prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook);

    // 複数の評価更新を同時実行
    const updatePromises = [1, 2, 3, 4, 5].map(rating => 
      updateBookRating(userBookId, rating)
    );

    const results = await Promise.all(updatePromises);

    // 全ての更新が成功すること
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
```

## アクセシビリティテストケース

### 1. キーボード操作テスト
```javascript
describe('Accessibility Tests', () => {
  test('should navigate star rating with keyboard', async () => {
    const handleChange = jest.fn();
    render(<StarRating value={null} onChange={handleChange} />);
    
    const stars = screen.getAllByRole('button');
    
    // Tabで最初の星にフォーカス
    await user.tab();
    expect(stars[0]).toHaveFocus();
    
    // 矢印キーで移動
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(stars[2]).toHaveFocus();
    
    // Enterで選択
    await user.keyboard('{Enter}');
    expect(handleChange).toHaveBeenCalledWith(3);
    
    // Spaceでも選択可能
    await user.keyboard('{ArrowRight}{Space}');
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  test('should have proper ARIA labels', () => {
    render(
      <StarRating 
        value={3} 
        onChange={jest.fn()} 
        aria-label="書籍の評価"
      />
    );
    
    expect(screen.getByLabelText('書籍の評価')).toBeInTheDocument();
    
    const stars = screen.getAllByRole('button');
    expect(stars[2]).toHaveAttribute('aria-label', '3星の評価');
    expect(stars[2]).toHaveAttribute('aria-pressed', 'true');
    expect(stars[3]).toHaveAttribute('aria-pressed', 'false');
  });

  test('should support screen readers', () => {
    render(<ReviewEditor value="テストレビュー" onChange={jest.fn()} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'レビュー入力');
    expect(textarea).toHaveAttribute('aria-describedby', 'char-count');
    
    expect(screen.getById('char-count')).toHaveTextContent('7/2000');
  });
});
```

## テスト実行基準

### カバレッジ要件
- 単体テスト: 90%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: ユーザーシナリオ100%

### 実行環境
- Jest + React Testing Library (単体・統合)
- Playwright (E2E)
- Axe-core (アクセシビリティ)
- @testing-library/user-event (ユーザーインタラクション)

### パフォーマンス基準
- 評価更新: 1秒以内
- 統計計算: 3秒以内（1000件データ）
- UI レンダリング: 100ms以内

### CI/CD統合
- プルリクエスト時に全テスト実行
- カバレッジレポート生成
- パフォーマンス回帰テスト
- アクセシビリティチェック