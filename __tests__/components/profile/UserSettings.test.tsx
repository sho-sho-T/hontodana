/**
 * UserSettings コンポーネントの単体テスト
 * Red Phase: 失敗するテストを実装
 * TASK-301 - ユーザープロフィール・設定画面
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserSettings from '@/components/profile/UserSettings'
import type { UserSettingsProps } from '@/types/profile'

// テスト用のモックProps
const mockSettings = {
  theme: 'light' as const,
  displayMode: 'grid' as const,
  booksPerPage: 20,
  defaultBookType: 'physical' as const,
  readingGoal: 50
}

const mockProps: UserSettingsProps = {
  settings: mockSettings,
  onSave: jest.fn(),
  loading: false
}

describe('UserSettings - Red Phase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('設定項目の表示テスト', () => {
    test('テーマ設定が正しく表示されること', () => {
      // Given: ユーザー設定データ
      // When: コンポーネントをレンダリング
      render(<UserSettings {...mockProps} />)
      
      // Then: テーマ設定項目が表示されること
      expect(screen.getByLabelText('テーマ')).toBeInTheDocument()
      expect(screen.getByDisplayValue('light')).toBeInTheDocument()
    })

    test('表示モード設定が正しく表示されること', () => {
      render(<UserSettings {...mockProps} />)
      
      expect(screen.getByLabelText('表示モード')).toBeInTheDocument()
      expect(screen.getByDisplayValue('grid')).toBeInTheDocument()
    })

    test('表示件数設定が正しく表示されること', () => {
      render(<UserSettings {...mockProps} />)
      
      expect(screen.getByLabelText('表示件数')).toBeInTheDocument()
      expect(screen.getByDisplayValue('20')).toBeInTheDocument()
    })

    test('デフォルト書籍タイプが正しく表示されること', () => {
      render(<UserSettings {...mockProps} />)
      
      expect(screen.getByLabelText('デフォルト書籍タイプ')).toBeInTheDocument()
      expect(screen.getByDisplayValue('physical')).toBeInTheDocument()
    })

    test('読書目標が正しく表示されること', () => {
      render(<UserSettings {...mockProps} />)
      
      expect(screen.getByLabelText('年間読書目標')).toBeInTheDocument()
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })
  })

  describe('テーマ切り替えテスト', () => {
    test('ライトテーマからダークテーマに変更できること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const themeSelect = screen.getByLabelText('テーマ')
      await userEvent.selectOptions(themeSelect, 'dark')
      
      expect(screen.getByDisplayValue('dark')).toBeInTheDocument()
    })

    test('システムテーマを選択できること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const themeSelect = screen.getByLabelText('テーマ')
      await userEvent.selectOptions(themeSelect, 'system')
      
      expect(screen.getByDisplayValue('system')).toBeInTheDocument()
    })

    test('テーマ変更が即座にプレビューに反映されること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const themeSelect = screen.getByLabelText('テーマ')
      await userEvent.selectOptions(themeSelect, 'dark')
      
      // ダークテーマのプレビュー要素が存在すること
      expect(screen.getByTestId('theme-preview')).toHaveClass('dark')
    })
  })

  describe('表示設定変更テスト', () => {
    test('グリッド表示からリスト表示に変更できること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const displayModeSelect = screen.getByLabelText('表示モード')
      await userEvent.selectOptions(displayModeSelect, 'list')
      
      expect(screen.getByDisplayValue('list')).toBeInTheDocument()
    })

    test('表示件数を変更できること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const booksPerPageInput = screen.getByLabelText('表示件数')
      await userEvent.clear(booksPerPageInput)
      await userEvent.type(booksPerPageInput, '50')
      
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })

    test('デフォルト書籍タイプを変更できること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const bookTypeSelect = screen.getByLabelText('デフォルト書籍タイプ')
      await userEvent.selectOptions(bookTypeSelect, 'ebook')
      
      expect(screen.getByDisplayValue('ebook')).toBeInTheDocument()
    })
  })

  describe('バリデーションテスト', () => {
    test('表示件数が範囲外の場合エラーメッセージが表示されること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const booksPerPageInput = screen.getByLabelText('表示件数')
      const saveButton = screen.getByRole('button', { name: '設定を保存' })
      
      await userEvent.clear(booksPerPageInput)
      await userEvent.type(booksPerPageInput, '5')
      await userEvent.click(saveButton)
      
      expect(screen.getByText('表示件数は10件以上100件以下で設定してください')).toBeInTheDocument()
    })

    test('読書目標が範囲外の場合エラーメッセージが表示されること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const readingGoalInput = screen.getByLabelText('年間読書目標')
      const saveButton = screen.getByRole('button', { name: '設定を保存' })
      
      await userEvent.clear(readingGoalInput)
      await userEvent.type(readingGoalInput, '1001')
      await userEvent.click(saveButton)
      
      expect(screen.getByText('読書目標は1冊以上1000冊以下で設定してください')).toBeInTheDocument()
    })

    test('必須項目が未設定の場合エラーメッセージが表示されること', async () => {
      const propsWithoutTheme = {
        ...mockProps,
        settings: { ...mockSettings, theme: undefined }
      }
      render(<UserSettings {...propsWithoutTheme} />)
      
      const saveButton = screen.getByRole('button', { name: '設定を保存' })
      await userEvent.click(saveButton)
      
      expect(screen.getByText('テーマの選択は必須です')).toBeInTheDocument()
    })
  })

  describe('保存機能テスト', () => {
    test('設定保存ボタンクリック時にonSaveが正しい値で呼ばれること', async () => {
      const mockOnSave = jest.fn()
      render(<UserSettings {...mockProps} onSave={mockOnSave} />)
      
      // テーマを変更
      const themeSelect = screen.getByLabelText('テーマ')
      await userEvent.selectOptions(themeSelect, 'dark')
      
      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '設定を保存' })
      await userEvent.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockSettings,
        theme: 'dark'
      })
    })

    test('複数の設定を変更して保存できること', async () => {
      const mockOnSave = jest.fn()
      render(<UserSettings {...mockProps} onSave={mockOnSave} />)
      
      // 複数の設定を変更
      await userEvent.selectOptions(screen.getByLabelText('テーマ'), 'dark')
      await userEvent.selectOptions(screen.getByLabelText('表示モード'), 'list')
      await userEvent.clear(screen.getByLabelText('表示件数'))
      await userEvent.type(screen.getByLabelText('表示件数'), '30')
      
      const saveButton = screen.getByRole('button', { name: '設定を保存' })
      await userEvent.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockSettings,
        theme: 'dark',
        displayMode: 'list',
        booksPerPage: 30
      })
    })

    test('ローディング状態で保存ボタンが無効になること', () => {
      render(<UserSettings {...mockProps} loading={true} />)
      
      const saveButton = screen.getByRole('button', { name: /保存|更新中/ })
      expect(saveButton).toBeDisabled()
    })

    test('ローディング状態でスピナーが表示されること', () => {
      render(<UserSettings {...mockProps} loading={true} />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/保存中|更新中/)).toBeInTheDocument()
    })
  })

  describe('キーボード操作テスト', () => {
    test('Tabキーで適切にフォーカスが移動すること', async () => {
      render(<UserSettings {...mockProps} />)
      
      const themeSelect = screen.getByLabelText('テーマ')
      const displayModeSelect = screen.getByLabelText('表示モード')
      const booksPerPageInput = screen.getByLabelText('表示件数')
      
      themeSelect.focus()
      expect(themeSelect).toHaveFocus()
      
      await userEvent.tab()
      expect(displayModeSelect).toHaveFocus()
      
      await userEvent.tab()
      expect(booksPerPageInput).toHaveFocus()
    })

    test('Enterキーで保存処理が実行されること', async () => {
      const mockOnSave = jest.fn()
      render(<UserSettings {...mockProps} onSave={mockOnSave} />)
      
      const saveButton = screen.getByRole('button', { name: '設定を保存' })
      saveButton.focus()
      
      await userEvent.keyboard('{Enter}')
      
      expect(mockOnSave).toHaveBeenCalled()
    })
  })

  describe('レスポンシブ対応テスト', () => {
    test('モバイル表示時に適切なレイアウトが適用されること', () => {
      // モバイル表示をシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<UserSettings {...mockProps} />)
      
      const container = screen.getByTestId('settings-container')
      expect(container).toHaveClass('mobile-layout')
    })

    test('デスクトップ表示時に適切なレイアウトが適用されること', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      
      render(<UserSettings {...mockProps} />)
      
      const container = screen.getByTestId('settings-container')
      expect(container).toHaveClass('desktop-layout')
    })
  })

  describe('パフォーマンステスト', () => {
    test('設定保存処理が1秒以内に完了すること', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(true)
      render(<UserSettings {...mockProps} onSave={mockOnSave} />)
      
      const startTime = Date.now()
      const saveButton = screen.getByRole('button', { name: '設定を保存' })
      await userEvent.click(saveButton)
      
      await waitFor(() => {
        const endTime = Date.now()
        expect(endTime - startTime).toBeLessThan(1000)
      })
    })
  })
})