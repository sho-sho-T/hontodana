import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfilePage from '@/components/profile/ProfilePage'

export const metadata = {
  title: 'プロフィール設定 - hontodana',
  description: 'アカウント情報と表示設定を管理',
}

export default async function ProfilePageRoute() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return <ProfilePage />
}