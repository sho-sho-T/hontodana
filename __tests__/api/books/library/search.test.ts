import { NextRequest } from 'next/server';
import { GET } from '@/app/api/books/library/search/route';

describe('/api/books/library/search', () => {
  test('基本的な検索機能', async () => {
    const url = new URL('http://localhost:3000/api/books/library/search');
    url.searchParams.set('query', 'JavaScript');
    
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.books).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.page).toBe(1);
  });

  test('フィルタ条件での検索', async () => {
    const url = new URL('http://localhost:3000/api/books/library/search');
    url.searchParams.set('query', 'JavaScript');
    url.searchParams.set('status', 'reading');
    
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.books).toBeDefined();
    
    // レスポンスの全書籍が reading 状態であることを確認
    data.books.forEach((book: any) => {
      expect(book.status).toBe('reading');
    });
  });

  test('ページネーション機能', async () => {
    const url = new URL('http://localhost:3000/api/books/library/search');
    url.searchParams.set('page', '2');
    url.searchParams.set('limit', '5');
    
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.books.length).toBeLessThanOrEqual(5);
    expect(data.page).toBe(2);
    expect(data.limit).toBe(5);
  });

  test('認証が必要', async () => {
    // 認証なしでリクエスト
    const url = new URL('http://localhost:3000/api/books/library/search');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    
    expect(response.status).toBe(401);
  });

  test('不正なパラメータの処理', async () => {
    const url = new URL('http://localhost:3000/api/books/library/search');
    url.searchParams.set('page', '-1');
    url.searchParams.set('limit', '1000');
    
    const request = new NextRequest(url);
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeDefined();
  });

  test('カテゴリフィルタの処理', async () => {
    const url = new URL('http://localhost:3000/api/books/library/search');
    url.searchParams.set('categories', '技術書,ビジネス書');
    
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // カテゴリが一致することを確認（実装後に追加）
  });

  test('進捗率フィルタの処理', async () => {
    const url = new URL('http://localhost:3000/api/books/library/search');
    url.searchParams.set('progressMin', '20');
    url.searchParams.set('progressMax', '80');
    
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // 進捗率が範囲内であることを確認（実装後に追加）
  });

  test('空の検索結果', async () => {
    const url = new URL('http://localhost:3000/api/books/library/search');
    url.searchParams.set('query', '存在しない書籍');
    
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.books).toHaveLength(0);
    expect(data.total).toBe(0);
  });
});