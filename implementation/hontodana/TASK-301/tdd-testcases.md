# TASK-301: ユーザープロフィール・設定画面 - テストケース設計

## テストケース概要

TASK-301の実装に対する包括的なテストケースを定義します。単体テスト、統合テスト、コンポーネントテスト、E2Eテストをカバーします。

## テスト構成

```
__tests__/
├── lib/server-actions/
│   └── profile.test.ts           # Server Actions単体テスト
├── components/profile/
│   ├── ProfileForm.test.tsx      # プロフィール編集フォームテスト
│   ├── ThemeSelector.test.tsx    # テーマ選択テスト
│   ├── DisplaySettings.test.tsx  # 表示設定テスト
│   └── AvatarUpload.test.tsx     # アバターアップロードテスト
└── e2e/
    └── profile.test.ts           # E2Eテスト
```

## Server Actions 単体テスト

### `__tests__/lib/server-actions/profile.test.ts`

#### TC-SA-001: getUserProfile - 正常系

```typescript
describe('getUserProfile', () => {
  test('認証済みユーザーのプロフィール情報を正常に取得できること', async () => {
    // Given: 認証済みユーザーが存在
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockProfile = {
      id: 'user-123',
      name: '山田太郎',
      avatarUrl: 'https://example.com/avatar.jpg',
      theme: 'light',
      displayMode: 'grid',
      booksPerPage: 20,
      defaultBookType: 'physical',
      readingGoal: 50
    }
    
    // When: プロフィール取得を実行
    const result = await getUserProfile()
    
    // Then: プロフィール情報が正常に返されること
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockProfile)
  })
})
```

#### TC-SA-002: getUserProfile - 異常系

```typescript
test('未認証ユーザーの場合エラーが返されること', async () => {
  // Given: 未認証状態
  mockGetCurrentUser.mockResolvedValue(null)
  
  // When: プロフィール取得を実行
  const result = await getUserProfile()
  
  // Then: 認証エラーが返されること
  expect(result.success).toBe(false)
  expect(result.error).toBe(PROFILE_ERROR_MESSAGES.AUTH_REQUIRED)
})
```

#### TC-SA-003: updateUserProfile - プロフィール更新

```typescript
describe('updateUserProfile', () => {
  test('有効なプロフィール情報で更新が成功すること', async () => {
    // Given: 有効な更新データ
    const updateData = {
      name: '鈴木花子',
      readingGoal: 100
    }
    
    // When: プロフィール更新を実行
    const result = await updateUserProfile(updateData)
    
    // Then: 更新が成功すること
    expect(result.success).toBe(true)
    expect(result.data.name).toBe('鈴木花子')
    expect(result.data.readingGoal).toBe(100)
  })
})
```

#### TC-SA-004: updateUserProfile - バリデーションエラー

```typescript
test('表示名が空の場合バリデーションエラーになること', async () => {
  // Given: 無効な更新データ
  const updateData = { name: '', readingGoal: 50 }
  
  // When: プロフィール更新を実行
  const result = await updateUserProfile(updateData)
  
  // Then: バリデーションエラーが返されること
  expect(result.success).toBe(false)
  expect(result.error).toBe(PROFILE_ERROR_MESSAGES.NAME_REQUIRED)
})

test('表示名が50文字を超える場合バリデーションエラーになること', async () => {
  // Given: 長すぎる表示名
  const updateData = { name: 'あ'.repeat(51), readingGoal: 50 }
  
  // When: プロフィール更新を実行
  const result = await updateUserProfile(updateData)
  
  // Then: バリデーションエラーが返されること
  expect(result.success).toBe(false)
  expect(result.error).toBe(PROFILE_ERROR_MESSAGES.NAME_TOO_LONG)
})

test('読書目標が範囲外の場合バリデーションエラーになること', async () => {
  // Given: 範囲外の読書目標
  const updateData = { name: '田中次郎', readingGoal: 500 }
  
  // When: プロフィール更新を実行
  const result = await updateUserProfile(updateData)
  
  // Then: バリデーションエラーが返されること
  expect(result.success).toBe(false)
  expect(result.error).toBe(PROFILE_ERROR_MESSAGES.READING_GOAL_INVALID)
})
```

#### TC-SA-005: updateUserSettings - 設定更新

```typescript
describe('updateUserSettings', () => {
  test('有効な設定データで更新が成功すること', async () => {
    // Given: 有効な設定データ
    const settingsData = {
      theme: 'dark',
      displayMode: 'list',
      booksPerPage: 50,
      defaultBookType: 'kindle'
    }
    
    // When: 設定更新を実行
    const result = await updateUserSettings(settingsData)
    
    // Then: 更新が成功すること
    expect(result.success).toBe(true)
    expect(result.data.theme).toBe('dark')
    expect(result.data.displayMode).toBe('list')
    expect(result.data.booksPerPage).toBe(50)
    expect(result.data.defaultBookType).toBe('kindle')
  })
})
```

#### TC-SA-006: uploadAvatarImage - アバター画像アップロード

```typescript
describe('uploadAvatarImage', () => {
  test('有効な画像ファイルのアップロードが成功すること', async () => {
    // Given: 有効な画像ファイル
    const mockFile = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' })
    
    // When: 画像アップロードを実行
    const result = await uploadAvatarImage(mockFile)
    
    // Then: アップロードが成功すること
    expect(result.success).toBe(true)
    expect(result.data.url).toMatch(/^https:\/\//)
  })
  
  test('サイズが大きすぎる画像ファイルでエラーになること', async () => {
    // Given: 大きすぎるファイル
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    
    // When: 画像アップロードを実行
    const result = await uploadAvatarImage(largeFile)
    
    // Then: サイズエラーが返されること
    expect(result.success).toBe(false)
    expect(result.error).toBe(PROFILE_ERROR_MESSAGES.FILE_TOO_LARGE)
  })
  
  test('無効なファイル形式でエラーになること', async () => {
    // Given: 無効なファイル形式
    const invalidFile = new File(['fake-data'], 'document.pdf', { type: 'application/pdf' })
    
    // When: 画像アップロードを実行
    const result = await uploadAvatarImage(invalidFile)
    
    // Then: 形式エラーが返されること
    expect(result.success).toBe(false)
    expect(result.error).toBe(PROFILE_ERROR_MESSAGES.INVALID_FILE_TYPE)
  })
})
```

## React Components テスト

### `__tests__/components/profile/ProfileForm.test.tsx`

#### TC-PC-001: ProfileForm - 基本表示

```typescript
describe('ProfileForm', () => {
  test('プロフィール情報が正しく表示されること', () => {
    // Given: プロフィールデータ
    const mockProfile = {
      name: '山田太郎',
      avatarUrl: 'https://example.com/avatar.jpg',
      readingGoal: 50
    }
    
    // When: コンポーネントをレンダリング
    render(<ProfileForm profile={mockProfile} onSave={mockOnSave} />)
    
    // Then: 各フィールドに値が設定されていること
    expect(screen.getByDisplayValue('山田太郎')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })
})
```

#### TC-PC-002: ProfileForm - フォーム入力

```typescript
test('フォーム入力が正常に動作すること', async () => {
  // Given: 空のフォーム
  render(<ProfileForm profile={{}} onSave={mockOnSave} />)
  
  // When: フォームに入力
  await userEvent.type(screen.getByLabelText('表示名'), '新しい名前')
  await userEvent.type(screen.getByLabelText('読書目標'), '75')
  
  // Then: 入力値が反映されること
  expect(screen.getByDisplayValue('新しい名前')).toBeInTheDocument()
  expect(screen.getByDisplayValue('75')).toBeInTheDocument()
})
```

#### TC-PC-003: ProfileForm - バリデーション

```typescript
test('必須項目が空の場合エラーが表示されること', async () => {
  // Given: プロフィールフォーム
  render(<ProfileForm profile={{}} onSave={mockOnSave} />)
  
  // When: 表示名を空にして保存ボタンをクリック
  await userEvent.clear(screen.getByLabelText('表示名'))
  await userEvent.click(screen.getByRole('button', { name: '保存' }))
  
  // Then: エラーメッセージが表示されること
  expect(screen.getByText('表示名は必須です')).toBeInTheDocument()
})
```

### `__tests__/components/profile/ThemeSelector.test.tsx`

#### TC-TC-001: ThemeSelector - テーマ選択

```typescript
describe('ThemeSelector', () => {
  test('テーマ選択が正常に動作すること', async () => {
    // Given: テーマ選択コンポーネント
    const mockOnChange = jest.fn()
    render(<ThemeSelector currentTheme="light" onChange={mockOnChange} />)
    
    // When: Darkテーマを選択
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }))
    
    // Then: onChange が呼ばれること
    expect(mockOnChange).toHaveBeenCalledWith('dark')
  })
  
  test('現在のテーマがハイライトされること', () => {
    // Given: Lightテーマが選択されている状態
    render(<ThemeSelector currentTheme="light" onChange={mockOnChange} />)
    
    // When: コンポーネントがレンダリングされる
    // Then: Lightボタンがアクティブ状態になっていること
    const lightButton = screen.getByRole('button', { name: 'Light' })
    expect(lightButton).toHaveClass('bg-blue-500') // アクティブクラス
  })
})
```

### `__tests__/components/profile/DisplaySettings.test.tsx`

#### TC-DS-001: DisplaySettings - 表示設定

```typescript
describe('DisplaySettings', () => {
  test('表示モード切り替えが正常に動作すること', async () => {
    // Given: 表示設定コンポーネント
    const mockOnChange = jest.fn()
    const settings = { displayMode: 'grid', booksPerPage: 20, defaultBookType: 'physical' }
    render(<DisplaySettings settings={settings} onChange={mockOnChange} />)
    
    // When: リストモードを選択
    await userEvent.click(screen.getByRole('button', { name: 'List' }))
    
    // Then: onChange が正しい値で呼ばれること
    expect(mockOnChange).toHaveBeenCalledWith({ ...settings, displayMode: 'list' })
  })
  
  test('1ページあたりの表示数変更が動作すること', async () => {
    // Given: 表示設定コンポーネント
    const mockOnChange = jest.fn()
    const settings = { displayMode: 'grid', booksPerPage: 20, defaultBookType: 'physical' }
    render(<DisplaySettings settings={settings} onChange={mockOnChange} />)
    
    // When: 表示数を50に変更
    await userEvent.selectOptions(screen.getByLabelText('1ページあたりの表示数'), '50')
    
    // Then: onChange が正しい値で呼ばれること
    expect(mockOnChange).toHaveBeenCalledWith({ ...settings, booksPerPage: 50 })
  })
})
```

### `__tests__/components/profile/AvatarUpload.test.tsx`

#### TC-AU-001: AvatarUpload - 画像アップロード

```typescript
describe('AvatarUpload', () => {
  test('画像ファイル選択が正常に動作すること', async () => {
    // Given: アバターアップロードコンポーネント
    const mockOnUpload = jest.fn()
    render(<AvatarUpload currentUrl="" onUpload={mockOnUpload} />)
    
    // When: 画像ファイルを選択
    const file = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText('アバター画像を選択')
    await userEvent.upload(input, file)
    
    // Then: onUpload が呼ばれること
    expect(mockOnUpload).toHaveBeenCalledWith(file)
  })
  
  test('現在の画像が表示されること', () => {
    // Given: 現在のアバターURL
    const currentUrl = 'https://example.com/current-avatar.jpg'
    render(<AvatarUpload currentUrl={currentUrl} onUpload={mockOnUpload} />)
    
    // When: コンポーネントがレンダリングされる
    // Then: 現在の画像が表示されること
    const img = screen.getByRole('img', { name: '現在のアバター' })
    expect(img).toHaveAttribute('src', currentUrl)
  })
})
```

## E2E テスト

### `__tests__/e2e/profile.test.ts`

#### TC-E2E-001: プロフィール編集フロー全体

```typescript
describe('Profile Management E2E', () => {
  test('ユーザーがプロフィールを編集できること', async () => {
    // Given: ログイン済みユーザー
    await login('test@example.com', 'password123')
    
    // When: プロフィール画面に移動
    await page.goto('/profile')
    
    // Then: プロフィール画面が表示されること
    await expect(page.getByRole('heading', { name: 'プロフィール設定' })).toBeVisible()
    
    // When: 表示名を変更
    await page.getByLabel('表示名').fill('新しい表示名')
    
    // When: 読書目標を設定
    await page.getByLabel('読書目標').fill('100')
    
    // When: 保存ボタンをクリック
    await page.getByRole('button', { name: '保存' }).click()
    
    // Then: 成功メッセージが表示されること
    await expect(page.getByText('プロフィールを更新しました')).toBeVisible()
    
    // When: ページをリロード
    await page.reload()
    
    // Then: 変更が保持されていること
    await expect(page.getByLabel('表示名')).toHaveValue('新しい表示名')
    await expect(page.getByLabel('読書目標')).toHaveValue('100')
  })
})
```

#### TC-E2E-002: テーマ切り替えフロー

```typescript
test('テーマ切り替えが正常に動作すること', async () => {
  // Given: ログイン済みユーザー
  await login('test@example.com', 'password123')
  await page.goto('/profile')
  
  // When: Darkテーマを選択
  await page.getByRole('button', { name: 'Dark' }).click()
  
  // Then: テーマが即座に変更されること
  await expect(page.locator('html')).toHaveClass(/dark/)
  
  // When: 他のページに移動
  await page.goto('/protected')
  
  // Then: テーマ設定が保持されていること
  await expect(page.locator('html')).toHaveClass(/dark/)
})
```

#### TC-E2E-003: 画像アップロードフロー

```typescript
test('アバター画像のアップロード・削除ができること', async () => {
  // Given: ログイン済みユーザー
  await login('test@example.com', 'password123')
  await page.goto('/profile')
  
  // When: 画像ファイルをアップロード
  const fileInput = page.getByLabel('アバター画像を選択')
  await fileInput.setInputFiles('test-files/avatar.jpg')
  
  // Then: プレビューが表示されること
  await expect(page.getByRole('img', { name: '選択された画像' })).toBeVisible()
  
  // When: アップロードボタンをクリック
  await page.getByRole('button', { name: 'アップロード' }).click()
  
  // Then: 成功メッセージが表示されること
  await expect(page.getByText('画像をアップロードしました')).toBeVisible()
  
  // When: 削除ボタンをクリック
  await page.getByRole('button', { name: '画像を削除' }).click()
  
  // Then: 削除確認ダイアログが表示されること
  await expect(page.getByText('画像を削除しますか？')).toBeVisible()
  
  // When: 削除を確定
  await page.getByRole('button', { name: '削除' }).click()
  
  // Then: 画像が削除されること
  await expect(page.getByRole('img', { name: '現在のアバター' })).not.toBeVisible()
})
```

## パフォーマンステスト

### TC-PERF-001: ページ表示速度

```typescript
test('プロフィール画面の初期表示が2秒以内であること', async () => {
  // Given: ログイン済みユーザー
  await login('test@example.com', 'password123')
  
  // When: プロフィール画面に移動（時間計測開始）
  const startTime = Date.now()
  await page.goto('/profile')
  await page.waitForLoadState('networkidle')
  const endTime = Date.now()
  
  // Then: 表示時間が2秒以内であること
  const loadTime = endTime - startTime
  expect(loadTime).toBeLessThan(2000)
})
```

### TC-PERF-002: 設定保存速度

```typescript
test('設定保存処理が1秒以内で完了すること', async () => {
  // Given: プロフィール画面
  await page.goto('/profile')
  
  // When: 設定を変更して保存（時間計測）
  await page.getByLabel('表示名').fill('テスト名')
  const startTime = Date.now()
  await page.getByRole('button', { name: '保存' }).click()
  await page.waitForSelector('[data-testid="success-message"]')
  const endTime = Date.now()
  
  // Then: 保存時間が1秒以内であること
  const saveTime = endTime - startTime
  expect(saveTime).toBeLessThan(1000)
})
```

## アクセシビリティテスト

### TC-A11Y-001: キーボード操作

```typescript
test('キーボードですべての機能が操作できること', async () => {
  // Given: プロフィール画面
  await page.goto('/profile')
  
  // When: Tabキーでフォーカス移動
  await page.keyboard.press('Tab') // 表示名フィールド
  await expect(page.getByLabel('表示名')).toBeFocused()
  
  await page.keyboard.press('Tab') // 読書目標フィールド
  await expect(page.getByLabel('読書目標')).toBeFocused()
  
  await page.keyboard.press('Tab') // 保存ボタン
  await expect(page.getByRole('button', { name: '保存' })).toBeFocused()
  
  // When: Enterキーで保存実行
  await page.keyboard.press('Enter')
  
  // Then: 保存処理が実行されること
  await expect(page.getByText('プロフィールを更新しました')).toBeVisible()
})
```

### TC-A11Y-002: スクリーンリーダー対応

```typescript
test('適切なaria属性が設定されていること', async () => {
  // Given: プロフィール画面
  await page.goto('/profile')
  
  // Then: フォームフィールドにlabelが関連付けられていること
  const nameField = page.getByLabel('表示名')
  await expect(nameField).toHaveAttribute('aria-describedby')
  
  // Then: エラーメッセージにaria-liveが設定されていること
  await page.getByLabel('表示名').fill('')
  await page.getByRole('button', { name: '保存' }).click()
  
  const errorMessage = page.getByText('表示名は必須です')
  await expect(errorMessage).toHaveAttribute('aria-live', 'polite')
})
```

## テスト実行環境

### 単体・統合テスト
- **フレームワーク**: Jest + React Testing Library
- **環境**: Node.js 18+
- **データベース**: テスト用SQLiteまたはPostgreSQL
- **モック**: MSW (Mock Service Worker)

### E2Eテスト
- **フレームワーク**: Playwright
- **ブラウザ**: Chrome, Firefox, Safari
- **環境**: Docker コンテナ
- **テストデータ**: 専用テストデータベース

## カバレッジ目標

- **単体テスト**: 90%以上
- **統合テスト**: 80%以上
- **E2Eテスト**: 主要フロー100%カバー

## 継続的実行

```yaml
# GitHub Actions
name: Profile Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:profile
      - name: Run E2E tests
        run: npm run test:e2e:profile
```

---

**作成日**: 2025-08-25  
**最終更新**: 2025-08-25  
**テスト実行状況**: テストケース定義完了