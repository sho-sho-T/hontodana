/**
 * 検索機能のユーティリティ関数
 * TODO: 実装予定（TDD Red Phase）
 */

export interface SearchFilters {
  status?: 'want_to_read' | 'reading' | 'completed' | 'paused' | 'abandoned' | 'reference';
  categories?: string[];
  rating?: number[];
  registeredAfter?: string;
  registeredBefore?: string;
  progressMin?: number;
  progressMax?: number;
}

export interface SearchQuery {
  query: string;
  conditions: string[];
  params: any[];
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

/**
 * 検索キーワードから PostgreSQL の全文検索クエリを生成
 */
export function buildSearchQuery(searchTerm: string): SearchQuery {
  if (!searchTerm.trim()) {
    return {
      query: '',
      conditions: [],
      params: ['']
    };
  }

  // 特殊文字をエスケープしてからキーワードを分割
  const escapedTerm = escapeSearchTerm(searchTerm);
  const keywords = escapedTerm.trim().split(/\s+/);
  
  // 各キーワードに :* を付けてAND検索用のクエリを作成
  const tsqueryParam = keywords.map(keyword => `${keyword}:*`).join(' & ');
  
  return {
    query: "to_tsvector('japanese', title || ' ' || array_to_string(authors, ' ') || ' ' || COALESCE(description, '')) @@ to_tsquery('japanese', $1)",
    conditions: [],
    params: [tsqueryParam]
  };
}

/**
 * フィルタ条件からSQL条件とパラメータを生成
 */
export function buildFilterConditions(filters: SearchFilters): { conditions: string[], params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  
  // 読書状態フィルタ
  if (filters.status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(filters.status);
  }
  
  // カテゴリフィルタ（配列の重複チェック）
  if (filters.categories && filters.categories.length > 0) {
    conditions.push(`categories && $${params.length + 1}`);
    params.push(filters.categories);
  }
  
  // 評価フィルタ
  if (filters.rating && filters.rating.length > 0) {
    const ratingConditions = filters.rating.map(() => `rating = $${params.length + params.push(0)}`);
    // 実際の値を設定
    filters.rating.forEach((rating, index) => {
      params[params.length - filters.rating!.length + index] = rating;
    });
    conditions.push(`(${ratingConditions.join(' OR ')})`);
  }
  
  // 登録日フィルタ（開始日）
  if (filters.registeredAfter) {
    conditions.push(`created_at >= $${params.length + 1}`);
    params.push(filters.registeredAfter);
  }
  
  // 登録日フィルタ（終了日）
  if (filters.registeredBefore) {
    conditions.push(`created_at <= $${params.length + 1}`);
    params.push(filters.registeredBefore);
  }
  
  // 進捗率フィルタ（最小）
  if (filters.progressMin !== undefined) {
    conditions.push(`(current_page::float / NULLIF(page_count, 0)::float * 100) >= $${params.length + 1}`);
    params.push(filters.progressMin);
  }
  
  // 進捗率フィルタ（最大）
  if (filters.progressMax !== undefined) {
    conditions.push(`(current_page::float / NULLIF(page_count, 0)::float * 100) <= $${params.length + 1}`);
    params.push(filters.progressMax);
  }
  
  return { conditions, params };
}

/**
 * 検索キーワードをエスケープ
 */
export function escapeSearchTerm(term: string): string {
  if (!term) return term;
  
  // PostgreSQL tsquery で特別な意味を持つ文字をエスケープ
  return term
    .replace(/[&|!():]/g, '\\$&')  // &, |, !, (, ), : をエスケープ
    .replace(/\+/g, '\\+');        // + をエスケープ
}