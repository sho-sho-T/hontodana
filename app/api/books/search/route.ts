import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleBooksClient } from '@/lib/google-books/client'
import { validateSearchParams } from '@/lib/google-books/validation'
import { 
  GoogleBooksError, 
  ValidationError, 
  RateLimitError, 
  NetworkError 
} from '@/lib/google-books/errors'

/**
 * 認証チェックを行う
 */
async function authenticateUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

/**
 * リクエストパラメータを抽出する
 */
function extractSearchParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  return {
    q: searchParams.get('q') || undefined,
    maxResults: searchParams.get('maxResults') || undefined,
    startIndex: searchParams.get('startIndex') || undefined,
    langRestrict: searchParams.get('langRestrict') || undefined,
  }
}

/**
 * エラーを適切なHTTPレスポンスに変換する
 */
function handleError(error: unknown): NextResponse {
  console.error('Books search error:', error)
  
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: `バリデーションエラー: ${error.message}` },
      { status: 400 }
    )
  }
  
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message },
      { status: 429 }
    )
  }
  
  if (error instanceof NetworkError) {
    return NextResponse.json(
      { error: `ネットワークエラー: ${error.message}` },
      { status: 503 }
    )
  }
  
  if (error instanceof GoogleBooksError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }
  
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // 予期しないエラー
  return NextResponse.json(
    { error: '内部サーバーエラーが発生しました' },
    { status: 500 }
  )
}

/**
 * 書籍検索APIエンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    await authenticateUser()
    
    // パラメータの取得とバリデーション
    const rawParams = extractSearchParams(request)
    const validatedParams = validateSearchParams(rawParams)
    
    // Google Books API クライアント作成
    const googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY
    const client = new GoogleBooksClient(googleBooksApiKey)
    
    // 書籍検索実行
    const searchResponse = await client.searchBooks(validatedParams)
    
    return NextResponse.json(searchResponse)
    
  } catch (error) {
    return handleError(error)
  }
}