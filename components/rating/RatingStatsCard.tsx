'use client'

/**
 * 評価統計カードコンポーネント
 * ユーザーの読書評価統計を表示するカードコンポーネント
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { StarRatingDisplay } from './StarRating'
import type { RatingStatsCardProps, RatingStats } from '@/types/rating'

export function RatingStatsCard({
  stats,
  loading = false,
  className,
}: RatingStatsCardProps) {
  if (loading) {
    return <RatingStatsCardSkeleton className={className} />
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>読書評価統計</CardTitle>
          <CardDescription>評価データを読み込めませんでした</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const {
    averageRating,
    totalRated,
    totalBooks,
    distribution,
    reviewsCount,
  } = stats

  const ratedPercentage = totalBooks > 0 ? Math.round((totalRated / totalBooks) * 100) : 0
  const reviewPercentage = totalBooks > 0 ? Math.round((reviewsCount / totalBooks) * 100) : 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>読書評価統計</CardTitle>
        <CardDescription>
          あなたの読書記録と評価の概要
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 全体統計 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {totalBooks}
            </div>
            <div className="text-sm text-blue-700">総書籍数</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              {totalRated}
            </div>
            <div className="text-sm text-green-700">
              評価済み ({ratedPercentage}%)
            </div>
          </div>
        </div>

        {/* 平均評価 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">平均評価</h4>
          {averageRating !== null ? (
            <div className="flex items-center gap-3">
              <StarRatingDisplay 
                rating={Math.round(averageRating) as any} 
                size="md" 
              />
              <span className="text-lg font-semibold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({totalRated}件の評価)
              </span>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">まだ評価がありません</p>
          )}
        </div>

        {/* 評価分布 */}
        {totalRated > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">評価分布</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as keyof typeof distribution]
                const percentage = totalRated > 0 ? (count / totalRated) * 100 : 0
                
                return (
                  <div key={rating} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 w-12">
                      <span>{rating}</span>
                      <svg className="w-3 h-3 fill-yellow-400" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="w-12 text-right text-gray-600">
                      {count}冊
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* レビュー統計 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">レビュー</h4>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">
                {reviewsCount}件
              </div>
              <div className="text-sm text-gray-600">
                レビュー済み ({reviewPercentage}%)
              </div>
            </div>
            <div className="text-2xl">📝</div>
          </div>
        </div>

        {/* 読書傾向メッセージ */}
        {totalRated > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <div className="text-yellow-600 mt-0.5">💡</div>
              <div className="text-sm text-yellow-800">
                <strong>読書傾向:</strong> {getReadingTrend(averageRating, reviewPercentage)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 読書傾向メッセージを生成する関数
 */
function getReadingTrend(averageRating: number | null, reviewPercentage: number): string {
  if (averageRating === null) return '評価データが不足しています'
  
  const ratingLevel = averageRating >= 4.5 ? 'high' : averageRating >= 3.5 ? 'medium' : 'low'
  const reviewLevel = reviewPercentage >= 70 ? 'high' : reviewPercentage >= 30 ? 'medium' : 'low'
  
  const messages = {
    high: {
      high: '高評価で記録も充実！理想的な読書家です',
      medium: '本を厳選して読む傾向。質の高い読書を心がけています',
      low: '良書を見つける目が優秀！もっとレビューを書いてみては？'
    },
    medium: {
      high: '幅広いジャンルを楽しみ、しっかり記録しています',
      medium: 'バランスの良い読書スタイル。順調に記録を蓄積中',
      low: '読書量は順調。感想も記録してみると発見があるかも'
    },
    low: {
      high: '率直な評価と丁寧な記録。誠実な読書家です',
      medium: 'じっくり吟味して読書。自分なりのペースを大切に',
      low: '読書を始めたばかり？これから記録を充実させていきましょう'
    }
  }
  
  return messages[ratingLevel][reviewLevel as keyof typeof messages[typeof ratingLevel]]
}

/**
 * ローディング状態のスケルトンコンポーネント
 */
function RatingStatsCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 全体統計スケルトン */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
        
        {/* 平均評価スケルトン */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
          </div>
        </div>
        
        {/* その他のスケルトン */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}