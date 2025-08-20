/**
 * 本棚内書籍検索API エンドポイント
 * GET /api/books/library/search
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchBooks } from '@/lib/services/search-service';
import type { SearchFilters } from '@/lib/utils/search-utils';

/**
 * 認証チェックを行う
 */
async function authenticateUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * リクエストパラメータを検証・抽出する
 */
function extractAndValidateParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const query = searchParams.get('query') || '';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, Number.parseInt(searchParams.get('limit') || '20', 10)));
  
  const filters: SearchFilters = {};
  
  // 読書状態フィルタ
  const status = searchParams.get('status');
  if (status && ['want_to_read', 'reading', 'completed', 'paused', 'abandoned', 'reference'].includes(status)) {
    filters.status = status as any;
  }
  
  // カテゴリフィルタ
  const categories = searchParams.get('categories');
  if (categories) {
    filters.categories = categories.split(',').map(c => c.trim()).filter(Boolean);
  }
  
  // 評価フィルタ
  const rating = searchParams.get('rating');
  if (rating) {
    const ratings = rating.split(',').map(r => Number.parseInt(r.trim(), 10)).filter(r => r >= 1 && r <= 5);
    if (ratings.length > 0) {
      filters.rating = ratings;
    }
  }
  
  // 登録日フィルタ
  const registeredAfter = searchParams.get('registeredAfter');
  if (registeredAfter) {
    filters.registeredAfter = registeredAfter;
  }
  
  const registeredBefore = searchParams.get('registeredBefore');
  if (registeredBefore) {
    filters.registeredBefore = registeredBefore;
  }
  
  // 進捗率フィルタ
  const progressMin = searchParams.get('progressMin');
  if (progressMin) {
    const min = Number.parseFloat(progressMin);
    if (!isNaN(min) && min >= 0 && min <= 100) {
      filters.progressMin = min;
    }
  }
  
  const progressMax = searchParams.get('progressMax');
  if (progressMax) {
    const max = Number.parseFloat(progressMax);
    if (!isNaN(max) && max >= 0 && max <= 100) {
      filters.progressMax = max;
    }
  }
  
  // パラメータの妥当性チェック
  if (page < 1 || page > 10000) {
    throw new Error('ページ番号は1-10000の間で指定してください');
  }
  
  if (limit < 1 || limit > 100) {
    throw new Error('取得件数は1-100の間で指定してください');
  }
  
  return { query, page, limit, filters };
}

/**
 * エラーを適切なHTTPレスポンスに変換する
 */
function handleError(error: unknown): NextResponse {
  console.error('Library search error:', error);
  
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }
    
    if (error.message.includes('パラメータ') || error.message.includes('指定')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  }
  
  // 予期しないエラー
  return NextResponse.json(
    { error: '検索中にエラーが発生しました' },
    { status: 500 }
  );
}

/**
 * 本棚内書籍検索APIエンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await authenticateUser();
    
    // パラメータの取得とバリデーション
    const { query, page, limit, filters } = extractAndValidateParams(request);
    
    // 検索実行
    const result = await searchBooks({
      query,
      filters,
      userId: user.id,
      page,
      limit
    });
    
    return NextResponse.json({
      books: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext: result.hasNext,
      query: { query, filters }
    });
    
  } catch (error) {
    return handleError(error);
  }
}