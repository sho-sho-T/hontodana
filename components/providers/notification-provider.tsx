/**
 * 通知システムのプロバイダー
 */

'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { NotificationManager } from '@/lib/notifications/manager'
import { Toaster } from 'sonner'

const NotificationContext = createContext<NotificationManager | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const manager = NotificationManager.getInstance()

  return (
    <NotificationContext.Provider value={manager}>
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={5000}
      />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}