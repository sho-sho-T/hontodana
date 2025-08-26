'use client'

import type React from 'react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { AvatarUploadProps } from '@/types/profile'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function AvatarUpload({
  currentUrl,
  onUpload,
  onDelete,
  loading = false,
  className,
}: AvatarUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'ファイルサイズは2MB以下にしてください'
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'JPEG、PNG、WebP形式のファイルのみアップロード可能です'
    }
    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
  }, [])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const files = Array.from(event.dataTransfer.files)
    const imageFile = files.find(file => ALLOWED_TYPES.includes(file.type))
    
    if (imageFile) {
      handleFileSelect(imageFile)
    } else {
      setError('画像ファイルをドロップしてください')
    }
  }

  const handleUpload = async () => {
    if (selectedFile && onUpload) {
      try {
        await onUpload(selectedFile)
        setSelectedFile(null)
        setPreviewUrl(null)
        setError(null)
      } catch {
        setError('アップロードに失敗しました')
      }
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete()
        setError(null)
      } catch {
        setError('削除に失敗しました')
      }
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    // クリーンアップ: プレビューURLを解放
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const displayUrl = previewUrl || currentUrl

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>プロフィール画像</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 現在の画像/プレビュー表示 */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={previewUrl ? "選択された画像" : "現在のアバター"}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <span className="text-gray-400">👤</span>
              </div>
            )}
            
            {previewUrl && (
              <div className="absolute -top-1 -right-1">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            {previewUrl ? (
              <div className="space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? '処理中...' : 'アップロード'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  size="sm"
                >
                  キャンセル
                </Button>
              </div>
            ) : currentUrl ? (
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  変更
                </Button>
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    削除
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                画像を選択
              </Button>
            )}
          </div>
        </div>

        {/* ドラッグ&ドロップエリア */}
        {!previewUrl && (
          <div
            className={cn(
              'border-2 border-dashed rounded-md p-6 text-center transition-colors',
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400',
              loading && 'opacity-50 cursor-not-allowed'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-2">📤</div>
            <p className="text-sm text-gray-600">
              画像をここにドラッグ&ドロップ<br />
              または
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 underline ml-1"
                disabled={loading}
              >
                クリックして選択
              </button>
            </p>
          </div>
        )}

        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          id="avatar-file-input"
          aria-label="アバター画像を選択"
          disabled={loading}
        />
        
        {/* ファイル制限の説明 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• JPEG、PNG、WebP形式</p>
          <p>• 最大2MB</p>
          <p>• 推奨サイズ: 256×256px</p>
        </div>
      </CardContent>
    </Card>
  )
}