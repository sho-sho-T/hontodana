// プロフィール関連コンポーネントのエクスポート
// Red Phase: スタブ実装

export { default as ProfilePage } from './ProfilePage'
export { default as ProfileForm } from './ProfileForm'
export { default as ThemeSelector } from './ThemeSelector'
export { default as DisplaySettings } from './DisplaySettings'
export { default as AvatarUpload } from './AvatarUpload'

// 型もエクスポート
export type { 
  ProfileFormProps,
  ThemeSelectorProps,
  DisplaySettingsProps,
  AvatarUploadProps
} from '@/types/profile'