// プロフィール機能のエラーメッセージ定数

export const PROFILE_ERROR_MESSAGES = {
  // 認証・権限関連
  AUTH_REQUIRED: 'ログインが必要です',
  PROFILE_NOT_FOUND: 'プロフィールが見つかりません',
  
  // バリデーション関連
  NAME_REQUIRED: '表示名は必須です',
  NAME_TOO_LONG: '表示名は50文字以内で入力してください',
  READING_GOAL_INVALID: '読書目標は1-365冊の範囲で設定してください',
  
  // ファイルアップロード関連
  FILE_TOO_LARGE: 'ファイルサイズは2MB以下にしてください',
  INVALID_FILE_TYPE: 'JPEG、PNG、WebP形式のファイルのみアップロード可能です',
  UPLOAD_FAILED: '画像のアップロードに失敗しました',
  DELETE_FAILED: '画像の削除に失敗しました',
  
  // データ保存関連
  SAVE_FAILED: '設定の保存に失敗しました',
  UPDATE_FAILED: 'プロフィールの更新に失敗しました',
  
  // ネットワーク関連
  NETWORK_ERROR: 'ネットワークエラーが発生しました。しばらく経ってからお試しください',
  
  // 汎用エラー
  UNEXPECTED_ERROR: '予期しないエラーが発生しました',
} as const

export type ProfileErrorMessage = typeof PROFILE_ERROR_MESSAGES[keyof typeof PROFILE_ERROR_MESSAGES]