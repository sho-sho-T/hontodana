// Collection関連のエラーメッセージ定数

export const COLLECTION_ERROR_MESSAGES = {
  // 認証関連
  AUTH_REQUIRED: '認証が必要です',
  PERMISSION_DENIED: 'この操作を行う権限がありません',
  
  // バリデーション関連
  VALIDATION_ERROR: 'バリデーションエラーです',
  NAME_REQUIRED: '名前は必須です',
  NAME_TOO_LONG: '名前は100文字以下で入力してください',
  DESCRIPTION_TOO_LONG: '説明は500文字以下で入力してください',
  INVALID_COLOR: '有効なカラーコードを入力してください',
  INVALID_DATA: '無効なデータが入力されました',
  
  // 重複・制限関連
  COLLECTION_ALREADY_EXISTS: '同じ名前のコレクションが既に存在します',
  COLLECTION_LIMIT_EXCEEDED: 'コレクションは最大50個まで作成できます',
  BOOK_ALREADY_IN_COLLECTION: 'この書籍は既にコレクションに追加されています',
  
  // 存在確認関連
  COLLECTION_NOT_FOUND: 'コレクションが見つかりません',
  BOOK_NOT_FOUND: '書籍が見つかりません',
  BOOK_NOT_IN_COLLECTION: '指定された書籍がコレクションに見つかりません',
  
  // 操作失敗関連
  COLLECTION_CREATE_FAILED: 'コレクションの作成に失敗しました',
  COLLECTION_UPDATE_FAILED: 'コレクションの更新に失敗しました',
  COLLECTION_DELETE_FAILED: 'コレクションの削除に失敗しました',
  COLLECTION_GET_FAILED: 'コレクションの取得に失敗しました',
  BOOK_ADD_FAILED: '書籍のコレクションへの追加に失敗しました',
  BOOK_REMOVE_FAILED: 'コレクションからの書籍削除に失敗しました',
  BOOK_ORDER_UPDATE_FAILED: '書籍の順序更新に失敗しました',
  COLLECTION_DETAIL_GET_FAILED: 'コレクション詳細の取得に失敗しました',

  // Rating・Review関連
  INVALID_RATING: '評価は1-5の整数値である必要があります',
  INVALID_REVIEW_LENGTH: 'レビューは2000文字以下で入力してください',
  RATING_UPDATE_FAILED: '評価の更新に失敗しました',
  REVIEW_UPDATE_FAILED: 'レビューの更新に失敗しました',
  RATING_STATS_GET_FAILED: '評価統計の取得に失敗しました',
  RATED_BOOKS_GET_FAILED: '評価付き書籍の取得に失敗しました',
  INVALID_BOOK_ID: '無効な書籍IDです',
} as const;

// 使用例のための型
export type CollectionErrorMessage = typeof COLLECTION_ERROR_MESSAGES[keyof typeof COLLECTION_ERROR_MESSAGES];