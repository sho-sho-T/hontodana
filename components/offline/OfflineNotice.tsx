/**
 * オフライン状態の通知コンポーネント
 */

'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
// import { Alert, AlertDescription } from '@/components/ui/alert'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineNotice() {
  const { isOnline, isSlowConnection } = useNetworkStatus()

  if (isOnline && !isSlowConnection) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 border-orange-200 bg-orange-50 p-4 rounded-lg border">
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-orange-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        <div className="text-orange-800">
          {!isOnline ? (
            <>
              <strong>オフライン状態です。</strong> 
              インターネット接続を確認してください。一部の機能が制限されています。
            </>
          ) : (
            <>
              <strong>接続が不安定です。</strong> 
              ネットワーク接続が遅くなっています。
            </>
          )}
        </div>
      </div>
    </div>
  )
}