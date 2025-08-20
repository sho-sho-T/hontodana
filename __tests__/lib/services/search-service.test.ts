import { searchBooks, getSearchSuggestions } from '@/lib/services/search-service';
import type { SearchFilters } from '@/lib/utils/search-utils';

describe('searchBooks', () => {
  test('基本的な検索機能', async () => {
    const result = await searchBooks({
      query: 'JavaScript',
      userId: 'test-user'
    });

    expect(result.data).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBeGreaterThan(0);
  });

  test('日本語タイトルの検索', async () => {
    const result = await searchBooks({
      query: 'プログラミング',
      userId: 'test-user'
    });

    expect(result.data.length).toBeGreaterThanOrEqual(0);
    // 検索結果にキーワードが含まれることを確認（実装後に追加）
  });

  test('著者名での検索', async () => {
    const result = await searchBooks({
      query: '山田太郎',
      userId: 'test-user'
    });

    expect(result.data.length).toBeGreaterThanOrEqual(0);
  });

  test('複合条件での検索', async () => {
    const filters: SearchFilters = {
      status: 'reading',
      categories: ['技術書']
    };

    const result = await searchBooks({
      query: 'JavaScript',
      filters,
      userId: 'test-user'
    });

    expect(result.data).toBeDefined();
    // フィルタ条件に合致することを確認（実装後に追加）
  });

  test('ページネーション', async () => {
    const page1 = await searchBooks({
      query: 'test',
      userId: 'test-user',
      page: 1,
      limit: 5
    });

    const page2 = await searchBooks({
      query: 'test',
      userId: 'test-user',
      page: 2,
      limit: 5
    });

    expect(page1.data.length).toBeLessThanOrEqual(5);
    expect(page2.data.length).toBeLessThanOrEqual(5);
    expect(page1.page).toBe(1);
    expect(page2.page).toBe(2);
  });

  test('空のクエリでの全件取得', async () => {
    const result = await searchBooks({
      userId: 'test-user'
    });

    expect(result.data).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  test('存在しないユーザーでのエラー', async () => {
    await expect(searchBooks({
      query: 'test',
      userId: 'non-existent-user'
    })).rejects.toThrow();
  });
});

describe('getSearchSuggestions', () => {
  test('検索候補の取得', async () => {
    const suggestions = await getSearchSuggestions('Jav', 'test-user');
    
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });

  test('空のクエリでの候補取得', async () => {
    const suggestions = await getSearchSuggestions('', 'test-user');
    
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBe(0);
  });

  test('マッチしないクエリでの候補取得', async () => {
    const suggestions = await getSearchSuggestions('zzzzz', 'test-user');
    
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBe(0);
  });
});