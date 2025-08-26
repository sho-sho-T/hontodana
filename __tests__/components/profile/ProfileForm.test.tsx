/**
 * ProfileForm コンポーネントの単体テスト
 * Red Phase: 失敗するテストを実装
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileForm from '@/components/profile/ProfileForm'
import type { ProfileFormProps } from '@/types/profile'

// テスト用のモックProps
const mockProps: ProfileFormProps = {
  profile: {
    name: '山田太郎',
    avatarUrl: 'https://example.com/avatar.jpg',
    readingGoal: 50
  },
  onSave: jest.fn(),
  loading: false
}

describe('ProfileForm - Red Phase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('プロフィール情報が正しく表示されること', () => {
    // Given: プロフィールデータ
    // When: コンポーネントをレンダリング
    render(<ProfileForm {...mockProps} />)
    
    // Then: 各フィールドに値が設定されていること
    expect(screen.getByDisplayValue('山田太郎')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })

  test('フォーム入力が正常に動作すること', async () => {
    // Given: 空のフォーム
    const emptyProps = { ...mockProps, profile: {} }
    render(<ProfileForm {...emptyProps} />)
    
    // When: フォームに入力
    const nameInput = screen.getByLabelText('表示名')
    const goalInput = screen.getByLabelText('読書目標')
    
    await userEvent.type(nameInput, '新しい名前')
    await userEvent.type(goalInput, '75')
    
    // Then: 入力値が反映されること
    expect(screen.getByDisplayValue('新しい名前')).toBeInTheDocument()
    expect(screen.getByDisplayValue('75')).toBeInTheDocument()
  })

  test('必須項目が空の場合エラーが表示されること', async () => {
    // Given: プロフィールフォーム
    render(<ProfileForm {...mockProps} />)
    
    // When: 表示名を空にして保存ボタンをクリック
    const nameInput = screen.getByLabelText('表示名')
    const saveButton = screen.getByRole('button', { name: '保存' })
    
    await userEvent.clear(nameInput)
    await userEvent.click(saveButton)
    
    // Then: エラーメッセージが表示されること
    expect(screen.getByText('表示名は必須です')).toBeInTheDocument()
  })

  test('保存ボタンクリック時にonSaveが呼ばれること', async () => {
    // Given: プロフィールフォーム
    const mockOnSave = jest.fn()
    render(<ProfileForm {...mockProps} onSave={mockOnSave} />)
    
    // When: 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' })
    await userEvent.click(saveButton)
    
    // Then: onSave が正しい値で呼ばれること
    expect(mockOnSave).toHaveBeenCalledWith({
      name: '山田太郎',
      avatarUrl: 'https://example.com/avatar.jpg',
      readingGoal: 50
    })
  })

  test('ローディング状態で保存ボタンが無効になること', () => {
    // Given: ローディング状態
    render(<ProfileForm {...mockProps} loading={true} />)
    
    // When: コンポーネントがレンダリングされる
    const saveButton = screen.getByRole('button', { name: /保存|更新中/ })
    
    // Then: 保存ボタンが無効になっていること
    expect(saveButton).toBeDisabled()
  })

  test('読書目標が範囲外の値でバリデーションエラーが表示されること', async () => {
    // Given: プロフィールフォーム
    render(<ProfileForm {...mockProps} />)
    
    // When: 読書目標に範囲外の値を入力
    const goalInput = screen.getByLabelText('読書目標')
    await userEvent.clear(goalInput)
    await userEvent.type(goalInput, '500')
    
    const saveButton = screen.getByRole('button', { name: '保存' })
    await userEvent.click(saveButton)
    
    // Then: バリデーションエラーが表示されること
    expect(screen.getByText('読書目標は1-365冊の範囲で設定してください')).toBeInTheDocument()
  })
})