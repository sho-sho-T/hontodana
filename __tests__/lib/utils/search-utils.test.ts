import { buildSearchQuery, buildFilterConditions, escapeSearchTerm } from '@/lib/utils/search-utils';
import type { SearchFilters } from '@/lib/utils/search-utils';

describe('buildSearchQuery', () => {
  test('単一キーワードでのクエリ生成', () => {
    const result = buildSearchQuery('JavaScript');
    expect(result.query).toContain("to_tsquery('japanese', $1)");
    expect(result.params).toEqual(['JavaScript:*']);
  });

  test('複数キーワードでのAND検索', () => {
    const result = buildSearchQuery('JavaScript React');
    expect(result.params).toEqual(['JavaScript:* & React:*']);
  });

  test('特殊文字のエスケープ処理', () => {
    const result = buildSearchQuery('C++ & Java');
    expect(result.params[0]).toContain('C\\+\\+:*');
    expect(result.params[0]).toContain('\\&:*');
    expect(result.params[0]).toContain('Java:*');
  });

  test('空文字列の処理', () => {
    const result = buildSearchQuery('');
    expect(result.params).toEqual(['']);
  });

  test('日本語キーワードの処理', () => {
    const result = buildSearchQuery('プログラミング');
    expect(result.params).toEqual(['プログラミング:*']);
  });
});

describe('buildFilterConditions', () => {
  test('読書状態フィルタ', () => {
    const filters: SearchFilters = { status: 'reading' };
    const result = buildFilterConditions(filters);
    expect(result.conditions).toContain('status = $1');
    expect(result.params).toContain('reading');
  });

  test('複数フィルタの組み合わせ', () => {
    const filters: SearchFilters = {
      status: 'completed',
      categories: ['技術書', '小説'],
      registeredAfter: '2024-01-01'
    };
    const result = buildFilterConditions(filters);
    expect(result.conditions.length).toBe(3);
  });

  test('カテゴリフィルタ（複数）', () => {
    const filters: SearchFilters = {
      categories: ['技術書', 'ビジネス書']
    };
    const result = buildFilterConditions(filters);
    expect(result.conditions).toContain('categories && $1');
    expect(result.params).toContainEqual(['技術書', 'ビジネス書']);
  });

  test('進捗率の範囲フィルタ', () => {
    const filters: SearchFilters = {
      progressMin: 20,
      progressMax: 80
    };
    const result = buildFilterConditions(filters);
    expect(result.conditions).toContain('(current_page::float / NULLIF(page_count, 0)::float * 100) >= $1');
    expect(result.conditions).toContain('(current_page::float / NULLIF(page_count, 0)::float * 100) <= $2');
  });

  test('空のフィルタオブジェクト', () => {
    const filters: SearchFilters = {};
    const result = buildFilterConditions(filters);
    expect(result.conditions).toHaveLength(0);
    expect(result.params).toHaveLength(0);
  });
});

describe('escapeSearchTerm', () => {
  test('特殊文字のエスケープ', () => {
    expect(escapeSearchTerm('C++')).toBe('C\\+\\+');
    expect(escapeSearchTerm('test & example')).toBe('test \\& example');
    expect(escapeSearchTerm('test | example')).toBe('test \\| example');
  });

  test('通常の文字列は変更されない', () => {
    expect(escapeSearchTerm('JavaScript')).toBe('JavaScript');
    expect(escapeSearchTerm('プログラミング')).toBe('プログラミング');
  });

  test('空文字列の処理', () => {
    expect(escapeSearchTerm('')).toBe('');
  });
});