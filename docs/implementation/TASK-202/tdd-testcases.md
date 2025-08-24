# TASK-202: 読書統計・ダッシュボード - TDDテストケース

## 1. テストケース概要

### 1.1 テスト対象コンポーネント
1. **統計計算ロジック** (`lib/services/reading-stats.ts`)
2. **読書目標管理** (`hooks/useReadingGoals.ts`)
3. **ダッシュボードコンポーネント** (`components/dashboard/`)
4. **チャートコンポーネント** (`components/charts/`)
5. **統計データ取得API** (`app/api/statistics/`)

### 1.2 テスト戦略
- **単体テスト**: 統計計算関数、データ変換関数の精度検証
- **統合テスト**: APIエンドポイント、データベース操作の整合性検証
- **コンポーネントテスト**: React コンポーネントの表示・操作検証
- **パフォーマンステスト**: 大量データでの処理時間検証
- **アクセシビリティテスト**: WCAG 2.1 AA準拠確認

### 1.3 優先度定義
- **P1 (高)**: 基本機能、データ整合性、セキュリティ関連
- **P2 (中)**: UI/UX、パフォーマンス
- **P3 (低)**: アクセシビリティ、エッジケース

## 2. 単体テストケース

### 2.1 統計計算ロジックテスト (`__tests__/lib/services/reading-stats.test.ts`)

#### TC-01: 基本統計計算テスト (P1)
```typescript
describe('generateReadingStats', () => {
  const testUserId = 'test-user-stats'

  beforeEach(async () => {
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  test('基本統計が正確に計算される', async () => {
    // 準備: テストデータ作成
    const userBook1 = await createTestUserBook({
      userId: testUserId,
      status: 'reading',
      currentPage: 150,
      book: { pageCount: 300 }
    })
    
    const sessions = [
      { userBookId: userBook1.id, startPage: 1, endPage: 50, durationMinutes: 60 },
      { userBookId: userBook1.id, startPage: 51, endPage: 100, durationMinutes: 75 },
      { userBookId: userBook1.id, startPage: 101, endPage: 150, durationMinutes: 90 }
    ]
    
    for (const session of sessions) {
      await createTestReadingSession(session)
    }

    // 実行
    const stats = await generateReadingStats(testUserId)

    // 検証
    expect(stats.totalReadingTime).toBe(225) // 60+75+90
    expect(stats.averageSessionTime).toBe(75) // 225/3
    expect(stats.totalPagesRead).toBe(150) // 50+50+50
    expect(stats.averagePagesPerSession).toBe(50) // 150/3
    expect(stats.booksInProgress).toBe(1)
  })

  test('複数書籍の統計が正確に集計される', async () => {
    // 準備: 複数の書籍データ
    const book1 = await createTestUserBook({
      userId: testUserId,
      status: 'completed',
      currentPage: 200,
      book: { pageCount: 200 }
    })
    
    const book2 = await createTestUserBook({
      userId: testUserId,
      status: 'reading',
      currentPage: 100,
      book: { pageCount: 300 }
    })

    await createTestReadingSession({
      userBookId: book1.id,
      startPage: 1,
      endPage: 200,
      durationMinutes: 300
    })
    
    await createTestReadingSession({
      userBookId: book2.id,
      startPage: 1,
      endPage: 100,
      durationMinutes: 150
    })

    // 実行
    const stats = await generateReadingStats(testUserId)

    // 検証
    expect(stats.booksCompleted).toBe(1)
    expect(stats.booksInProgress).toBe(1)
    expect(stats.totalCompletedPages).toBe(200)
    expect(stats.averageBookLength).toBe(200)
    expect(stats.totalReadingTime).toBe(450)
  })

  test('データが存在しない場合の初期値を返す', async () => {
    const stats = await generateReadingStats('user-with-no-data')

    expect(stats.totalReadingTime).toBe(0)
    expect(stats.averageSessionTime).toBe(0)
    expect(stats.totalPagesRead).toBe(0)
    expect(stats.booksCompleted).toBe(0)
    expect(stats.dailyStats).toEqual([])
    expect(stats.weeklyStats).toEqual([])
  })

  test('無効なセッションデータは除外される', async () => {
    const userBook = await createTestUserBook({ userId: testUserId })
    
    // 有効なセッション
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 1,
      endPage: 50,
      durationMinutes: 60
    })
    
    // 無効なセッション (endPage < startPage)
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 100,
      endPage: 50, // 無効
      durationMinutes: -10 // 無効
    })

    const stats = await generateReadingStats(testUserId)

    expect(stats.totalPagesRead).toBe(49) // 有効なセッションのみ
    expect(stats.totalReadingTime).toBe(60) // 有効なセッションのみ
  })
})
```

#### TC-02: 期間別統計計算テスト (P1)
```typescript
describe('期間別統計計算', () => {
  test('日別統計が正確に生成される', async () => {
    const userBook = await createTestUserBook({ userId: testUserId })
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // 各日のセッションを作成
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 1,
      endPage: 30,
      durationMinutes: 45,
      sessionDate: today
    })
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 31,
      endPage: 60,
      durationMinutes: 60,
      sessionDate: yesterday
    })
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 61,
      endPage: 80,
      durationMinutes: 30,
      sessionDate: twoDaysAgo
    })

    const stats = await generateReadingStats(testUserId, { days: 7 })

    expect(stats.dailyStats).toHaveLength(7)
    expect(stats.dailyStats[0].pagesRead).toBe(29) // 今日
    expect(stats.dailyStats[0].readingTime).toBe(45)
    expect(stats.dailyStats[1].pagesRead).toBe(29) // 昨日
    expect(stats.dailyStats[2].pagesRead).toBe(19) // 2日前
  })

  test('週別統計が正確に生成される', async () => {
    const userBook = await createTestUserBook({ userId: testUserId })
    
    const thisWeek = new Date()
    const lastWeek = new Date(thisWeek)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 1,
      endPage: 100,
      durationMinutes: 120,
      sessionDate: thisWeek
    })
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 101,
      endPage: 150,
      durationMinutes: 75,
      sessionDate: lastWeek
    })

    const stats = await generateReadingStats(testUserId, { weeks: 4 })

    expect(stats.weeklyStats).toHaveLength(4)
    expect(stats.weeklyStats[0].pagesRead).toBe(99) // 今週
    expect(stats.weeklyStats[0].readingTime).toBe(120)
    expect(stats.weeklyStats[1].pagesRead).toBe(49) // 先週
  })

  test('月別統計が正確に生成される', async () => {
    const userBook = await createTestUserBook({ userId: testUserId })
    
    const thisMonth = new Date()
    const lastMonth = new Date(thisMonth)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 1,
      endPage: 200,
      durationMinutes: 300,
      sessionDate: thisMonth
    })
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 201,
      endPage: 300,
      durationMinutes: 180,
      sessionDate: lastMonth
    })

    const monthlyStats = await generateMonthlyStats(testUserId, 3)

    expect(monthlyStats).toHaveLength(3)
    expect(monthlyStats[0].pagesRead).toBe(199) // 今月
    expect(monthlyStats[1].pagesRead).toBe(99) // 先月
  })
})
```

#### TC-03: 読書速度計算テスト (P1)
```typescript
describe('読書速度計算', () => {
  test('平均読書速度が正確に計算される', async () => {
    const userBook = await createTestUserBook({ userId: testUserId })
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 1,
      endPage: 60,
      durationMinutes: 60 // 1ページ/分
    })
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 61,
      endPage: 120,
      durationMinutes: 30 // 2ページ/分
    })

    const speed = await calculateReadingSpeed(testUserId)

    expect(speed.averageSpeed).toBeCloseTo(1.5) // (1+2)/2
    expect(speed.minSpeed).toBe(1)
    expect(speed.maxSpeed).toBe(2)
  })

  test('異常値は除外して計算される', async () => {
    const userBook = await createTestUserBook({ userId: testUserId })
    
    // 通常のセッション
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 1,
      endPage: 30,
      durationMinutes: 30
    })
    
    // 異常に高速なセッション（誤入力想定）
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 31,
      endPage: 1000,
      durationMinutes: 1 // 969ページ/分 - 異常値
    })

    const speed = await calculateReadingSpeed(testUserId)

    // 異常値は除外されること
    expect(speed.averageSpeed).toBeCloseTo(1) // 29/30 ≈ 1
    expect(speed.outliers).toHaveLength(1)
  })

  test('0除算エラーが適切に処理される', async () => {
    const userBook = await createTestUserBook({ userId: testUserId })
    
    await createTestReadingSession({
      userBookId: userBook.id,
      startPage: 1,
      endPage: 50,
      durationMinutes: 0 // 0除算ケース
    })

    const speed = await calculateReadingSpeed(testUserId)

    expect(speed.averageSpeed).toBe(0)
    expect(speed.validSessions).toBe(0)
  })
})
```

### 2.2 読書目標管理テスト (`__tests__/hooks/useReadingGoals.test.ts`)

#### TC-04: 読書目標CRUD操作テスト (P1)
```typescript
describe('useReadingGoals', () => {
  test('読書目標の作成', async () => {
    const { result } = renderHook(() => useReadingGoals(testUserId))

    const goalData = {
      type: 'books_per_year' as const,
      targetValue: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    }

    await act(async () => {
      await result.current.createGoal(goalData)
    })

    expect(result.current.goals).toHaveLength(1)
    expect(result.current.goals[0].targetValue).toBe(50)
    expect(result.current.goals[0].isActive).toBe(true)
  })

  test('目標進捗の計算', async () => {
    // 準備: 年間50冊の目標を作成
    const goal = await createTestReadingGoal({
      userId: testUserId,
      type: 'books_per_year',
      targetValue: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    })

    // 完読書籍を10冊作成
    for (let i = 0; i < 10; i++) {
      await createTestUserBook({
        userId: testUserId,
        status: 'completed',
        finishDate: new Date()
      })
    }

    const { result } = renderHook(() => useReadingGoals(testUserId))

    await waitFor(() => {
      const progress = result.current.calculateProgress(goal)
      expect(progress.currentValue).toBe(10)
      expect(progress.progressPercentage).toBe(20) // 10/50 * 100
      expect(progress.isOnTrack).toBe(true) // 1月で20%なら順調
    })
  })

  test('複数目標の同時管理', async () => {
    const { result } = renderHook(() => useReadingGoals(testUserId))

    const booksGoal = {
      type: 'books_per_year' as const,
      targetValue: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    }

    const pagesGoal = {
      type: 'pages_per_month' as const,
      targetValue: 1000,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-31')
    }

    await act(async () => {
      await result.current.createGoal(booksGoal)
      await result.current.createGoal(pagesGoal)
    })

    expect(result.current.goals).toHaveLength(2)
    expect(result.current.activeGoals).toHaveLength(2)
    expect(result.current.goals.find(g => g.type === 'books_per_year')).toBeDefined()
    expect(result.current.goals.find(g => g.type === 'pages_per_month')).toBeDefined()
  })

  test('目標達成アラートの生成', async () => {
    const goal = await createTestReadingGoal({
      userId: testUserId,
      type: 'pages_per_month',
      targetValue: 1000,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-31')
    })

    // 月末まで5日、進捗50%の状況を想定
    const { result } = renderHook(() => useReadingGoals(testUserId))

    const mockDate = new Date('2024-08-26')
    jest.useFakeTimers().setSystemTime(mockDate)

    const alerts = result.current.getGoalAlerts()

    expect(alerts).toHaveLength(1)
    expect(alerts[0].type).toBe('behind_schedule')
    expect(alerts[0].message).toContain('目標達成が困難')

    jest.useRealTimers()
  })
})
```

### 2.3 データ変換・フォーマットテスト (`__tests__/lib/utils/stats-formatters.test.ts`)

#### TC-05: チャート用データ変換テスト (P2)
```typescript
describe('transformStatsForChart', () => {
  test('日別統計をChart.js形式に変換', () => {
    const dailyStats = [
      { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 },
      { date: '2024-08-19', pagesRead: 25, readingTime: 40, sessionsCount: 1 },
      { date: '2024-08-18', pagesRead: 0, readingTime: 0, sessionsCount: 0 }
    ]

    const chartData = transformStatsForChart(dailyStats, 'pages')

    expect(chartData.labels).toEqual(['8/18', '8/19', '8/20'])
    expect(chartData.datasets[0].data).toEqual([0, 25, 30])
    expect(chartData.datasets[0].label).toBe('読書ページ数')
    expect(chartData.datasets[0].borderColor).toBeDefined()
  })

  test('欠損データの補間処理', () => {
    const incompleteStats = [
      { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 },
      // 8/19 のデータが欠損
      { date: '2024-08-18', pagesRead: 25, readingTime: 40, sessionsCount: 1 }
    ]

    const chartData = transformStatsForChart(incompleteStats, 'pages', { fillGaps: true })

    expect(chartData.labels).toHaveLength(3)
    expect(chartData.datasets[0].data).toEqual([25, 0, 30]) // 欠損部分は0で補間
  })

  test('時系列データのソート確認', () => {
    const unsortedStats = [
      { date: '2024-08-18', pagesRead: 25, readingTime: 40, sessionsCount: 1 },
      { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 },
      { date: '2024-08-19', pagesRead: 20, readingTime: 35, sessionsCount: 1 }
    ]

    const chartData = transformStatsForChart(unsortedStats, 'pages')

    expect(chartData.labels).toEqual(['8/18', '8/19', '8/20'])
    expect(chartData.datasets[0].data).toEqual([25, 20, 30])
  })
})

describe('formatStatValue', () => {
  test('時間の表示フォーマット', () => {
    expect(formatStatValue(65, 'minutes')).toBe('1時間5分')
    expect(formatStatValue(30, 'minutes')).toBe('30分')
    expect(formatStatValue(120, 'minutes')).toBe('2時間')
  })

  test('ページ数の表示フォーマット', () => {
    expect(formatStatValue(1234, 'pages')).toBe('1,234ページ')
    expect(formatStatValue(0, 'pages')).toBe('0ページ')
  })

  test('パーセンテージの表示フォーマット', () => {
    expect(formatStatValue(0.75, 'percentage')).toBe('75%')
    expect(formatStatValue(0.333, 'percentage')).toBe('33.3%')
  })

  test('書籍数の表示フォーマット', () => {
    expect(formatStatValue(1, 'books')).toBe('1冊')
    expect(formatStatValue(10, 'books')).toBe('10冊')
  })
})
```

## 3. 統合テストケース

### 3.1 APIエンドポイントテスト (`__tests__/api/statistics/dashboard.test.ts`)

#### TC-06: ダッシュボード統計API テスト (P1)
```typescript
describe('/api/statistics/dashboard', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  test('認証済みユーザーの統計データを返す', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)

    const response = await request(app)
      .get('/api/statistics/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toHaveProperty('totalReadingTime')
    expect(response.body).toHaveProperty('totalPagesRead')
    expect(response.body).toHaveProperty('booksCompleted')
    expect(response.body).toHaveProperty('dailyStats')
    expect(response.body).toHaveProperty('readingPace')
  })

  test('期間指定パラメータが正常に動作する', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)

    const response = await request(app)
      .get('/api/statistics/dashboard')
      .query({ timeRange: 'month', days: 30 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.dailyStats).toHaveLength(30)
  })

  test('データが存在しない新規ユーザーへの対応', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)

    const response = await request(app)
      .get('/api/statistics/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.totalReadingTime).toBe(0)
    expect(response.body.totalPagesRead).toBe(0)
    expect(response.body.booksCompleted).toBe(0)
    expect(response.body.dailyStats).toEqual([])
  })

  test('不正なパラメータでバリデーションエラーを返す', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)

    const response = await request(app)
      .get('/api/statistics/dashboard')
      .query({ days: -1, timeRange: 'invalid' })
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(response.body.error).toBeDefined()
    expect(response.body.error.details).toContain('days must be positive')
  })

  test('未認証ユーザーは401エラー', async () => {
    await request(app)
      .get('/api/statistics/dashboard')
      .expect(401)
  })
})
```

#### TC-07: 読書目標API テスト (P1)
```typescript
describe('/api/statistics/goals', () => {
  test('読書目標の作成', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)

    const goalData = {
      type: 'books_per_year',
      targetValue: 50,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }

    const response = await request(app)
      .post('/api/statistics/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalData)
      .expect(201)

    expect(response.body.goal.id).toBeDefined()
    expect(response.body.goal.targetValue).toBe(50)
    expect(response.body.goal.isActive).toBe(true)
  })

  test('目標の更新', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)
    const goal = await createTestReadingGoal({ userId: user.id })

    const updateData = { targetValue: 60 }

    const response = await request(app)
      .put(`/api/statistics/goals/${goal.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200)

    expect(response.body.goal.targetValue).toBe(60)
  })

  test('目標進捗の取得', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)
    const goal = await createTestReadingGoal({ userId: user.id })

    // 進捗データ作成
    await createTestUserBook({
      userId: user.id,
      status: 'completed'
    })

    const response = await request(app)
      .get(`/api/statistics/goals/${goal.id}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.progress.currentValue).toBeGreaterThan(0)
    expect(response.body.progress.progressPercentage).toBeGreaterThan(0)
  })

  test('他ユーザーの目標へのアクセス拒否', async () => {
    const user1 = await createTestUser()
    const user2 = await createTestUser()
    const token1 = generateTestJWT(user1.id)
    const goal2 = await createTestReadingGoal({ userId: user2.id })

    await request(app)
      .get(`/api/statistics/goals/${goal2.id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(403)
  })
})
```

### 3.2 データベース統計クエリテスト (`__tests__/lib/database/stats-queries.test.ts`)

#### TC-08: 複雑なクエリの性能・精度テスト (P1)
```typescript
describe('Statistics Database Queries', () => {
  test('効率的な統計データ集約クエリ', async () => {
    const user = await createTestUser()
    
    // 大量のテストデータを作成
    const books = await createMultipleTestBooks(50)
    const userBooks = await Promise.all(
      books.map(book => createTestUserBook({
        userId: user.id,
        bookId: book.id,
        status: Math.random() > 0.5 ? 'completed' : 'reading'
      }))
    )

    // 各書籍に複数のセッションを作成
    for (const userBook of userBooks) {
      const sessionCount = Math.floor(Math.random() * 10) + 1
      for (let i = 0; i < sessionCount; i++) {
        await createTestReadingSession({
          userBookId: userBook.id,
          startPage: i * 10 + 1,
          endPage: (i + 1) * 10,
          durationMinutes: 30 + Math.floor(Math.random() * 30)
        })
      }
    }

    const startTime = Date.now()
    const stats = await generateReadingStats(user.id)
    const queryTime = Date.now() - startTime

    // パフォーマンス検証
    expect(queryTime).toBeLessThan(1500) // 1.5秒以内

    // データ精度検証
    expect(stats.totalReadingTime).toBeGreaterThan(0)
    expect(stats.totalPagesRead).toBeGreaterThan(0)
    expect(stats.booksCompleted + stats.booksInProgress).toBe(50)
  })

  test('期間指定クエリの精度', async () => {
    const user = await createTestUser()
    const userBook = await createTestUserBook({ userId: user.id })

    // 特定期間のセッションを作成
    const sessions = []
    for (let i = 0; i < 30; i++) {
      const sessionDate = new Date('2024-08-01')
      sessionDate.setDate(sessionDate.getDate() + i)
      
      sessions.push(createTestReadingSession({
        userBookId: userBook.id,
        startPage: i * 10 + 1,
        endPage: (i + 1) * 10,
        durationMinutes: 30,
        sessionDate
      }))
    }
    await Promise.all(sessions)

    // 期間指定での統計取得
    const monthStats = await getStatsByDateRange({
      userId: user.id,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-31')
    })

    expect(monthStats.totalSessions).toBe(30)
    expect(monthStats.totalPagesRead).toBe(270) // 30sessions * 9pages
    expect(monthStats.totalReadingTime).toBe(900) // 30sessions * 30min
  })

  test('ユーザー権限の検証', async () => {
    const user1 = await createTestUser()
    const user2 = await createTestUser()
    
    await createTestUserBook({ userId: user1.id })
    await createTestUserBook({ userId: user2.id })

    const user1Stats = await generateReadingStats(user1.id)
    const user2Stats = await generateReadingStats(user2.id)

    // 各ユーザーは自分のデータのみ取得できること
    expect(user1Stats.booksInProgress).toBe(1)
    expect(user2Stats.booksInProgress).toBe(1)

    // クロスユーザーデータの混在がないこと
    const combinedQuery = await prisma.readingSession.count({
      where: {
        OR: [
          { userBook: { userId: user1.id } },
          { userBook: { userId: user2.id } }
        ]
      }
    })
    expect(combinedQuery).toBe(0) // セッションデータがない状態
  })
})
```

## 4. コンポーネントテストケース

### 4.1 ダッシュボードコンポーネントテスト (`__tests__/components/dashboard/ReadingDashboard.test.tsx`)

#### TC-09: ダッシュボード表示テスト (P1)
```typescript
describe('ReadingDashboard', () => {
  const mockStatsData = {
    totalReadingTime: 150,
    averageSessionTime: 45,
    totalPagesRead: 350,
    booksCompleted: 5,
    booksInProgress: 3,
    dailyStats: [
      { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 },
      { date: '2024-08-19', pagesRead: 25, readingTime: 40, sessionsCount: 1 }
    ],
    readingPace: { last7Days: 25, last30Days: 20 }
  }

  test('統計データが正常に表示される', () => {
    render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    expect(screen.getByText('2時間30分')).toBeInTheDocument() // totalReadingTime
    expect(screen.getByText('350ページ')).toBeInTheDocument() // totalPagesRead
    expect(screen.getByText('5冊')).toBeInTheDocument() // booksCompleted
    expect(screen.getByText('3冊')).toBeInTheDocument() // booksInProgress
  })

  test('ローディング状態の表示', () => {
    render(<ReadingDashboard userId="test-user" isLoading={true} />)

    // スケルトンローディングの確認
    expect(screen.getAllByTestId('stats-skeleton')).toHaveLength(4)
    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
  })

  test('エラー状態のフォールバック表示', () => {
    const errorMessage = 'データの取得に失敗しました'
    render(
      <ReadingDashboard 
        userId="test-user" 
        error={errorMessage}
      />
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
  })

  test('時間範囲の切り替え', async () => {
    const mockOnTimeRangeChange = jest.fn()
    render(
      <ReadingDashboard 
        userId="test-user" 
        statsData={mockStatsData}
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    )

    const weekButton = screen.getByRole('button', { name: '1週間' })
    const monthButton = screen.getByRole('button', { name: '1ヶ月' })

    await userEvent.click(monthButton)
    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('month')

    await userEvent.click(weekButton)
    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('week')
  })

  test('レスポンシブレイアウトの適用', () => {
    // モバイル表示
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    const { rerender } = render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    const container = screen.getByTestId('dashboard-container')
    expect(container).toHaveClass('grid-cols-1')

    // デスクトップ表示
    Object.defineProperty(window, 'innerWidth', { value: 1024 })
    rerender(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    expect(container).toHaveClass('lg:grid-cols-4')
  })
})
```

#### TC-10: サマリーカードテスト (P2)
```typescript
describe('StatsSummaryCard', () => {
  test('統計値の正しいフォーマット表示', () => {
    render(
      <StatsSummaryCard
        title="総読書時間"
        value={150}
        icon={ClockIcon}
        trend={{
          value: 15,
          direction: 'up',
          period: '先週比'
        }}
        formatter="minutes"
      />
    )

    expect(screen.getByText('2時間30分')).toBeInTheDocument()
    expect(screen.getByText('総読書時間')).toBeInTheDocument()
    expect(screen.getByText('+15%')).toBeInTheDocument()
    expect(screen.getByText('先週比')).toBeInTheDocument()
  })

  test('トレンド情報の表示（上昇）', () => {
    render(
      <StatsSummaryCard
        title="読書ページ数"
        value={250}
        trend={{
          value: 10,
          direction: 'up',
          period: '先月比'
        }}
      />
    )

    const trendElement = screen.getByTestId('trend-indicator')
    expect(trendElement).toHaveClass('text-green-600')
    expect(screen.getByText('↗')).toBeInTheDocument()
  })

  test('トレンド情報の表示（下降）', () => {
    render(
      <StatsSummaryCard
        title="読書ペース"
        value={15}
        trend={{
          value: -5,
          direction: 'down',
          period: '先月比'
        }}
      />
    )

    const trendElement = screen.getByTestId('trend-indicator')
    expect(trendElement).toHaveClass('text-red-600')
    expect(screen.getByText('↘')).toBeInTheDocument()
    expect(screen.getByText('-5%')).toBeInTheDocument()
  })

  test('アイコンの表示', () => {
    render(
      <StatsSummaryCard
        title="完読書籍"
        value={5}
        icon={BookIcon}
      />
    )

    expect(screen.getByTestId('card-icon')).toBeInTheDocument()
  })

  test('ローディング状態のスケルトン表示', () => {
    render(<StatsSummaryCard title="読書時間" value={0} isLoading={true} />)

    expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('読書時間')).not.toBeInTheDocument()
  })
})
```

#### TC-11: 目標進捗カードテスト (P2)
```typescript
describe('GoalProgressCard', () => {
  const mockGoal = {
    id: 'goal-1',
    type: 'books_per_year' as const,
    targetValue: 50,
    currentValue: 12,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    isActive: true
  }

  test('目標進捗の正確な表示', () => {
    render(
      <GoalProgressCard
        goal={mockGoal}
        currentProgress={12}
        remainingDays={200}
        isOnTrack={true}
      />
    )

    expect(screen.getByText('年間読書目標')).toBeInTheDocument()
    expect(screen.getByText('12 / 50冊')).toBeInTheDocument()
    expect(screen.getByText('24%')).toBeInTheDocument() // 12/50 * 100
    expect(screen.getByText('順調です')).toBeInTheDocument()
  })

  test('目標達成予測の表示', () => {
    const behindGoal = { ...mockGoal, currentValue: 5 }
    
    render(
      <GoalProgressCard
        goal={behindGoal}
        currentProgress={5}
        remainingDays={200}
        isOnTrack={false}
      />
    )

    expect(screen.getByText('目標達成が困難')).toBeInTheDocument()
    expect(screen.getByText(/1日あたり/)).toBeInTheDocument() // 推奨ペースの表示
  })

  test('プログレスバーの表示', () => {
    render(
      <GoalProgressCard
        goal={mockGoal}
        currentProgress={12}
        remainingDays={200}
        isOnTrack={true}
      />
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '24')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  test('目標タイプ別の表示ラベル', () => {
    const pagesGoal = {
      ...mockGoal,
      type: 'pages_per_month' as const,
      targetValue: 1000,
      currentValue: 350
    }

    render(
      <GoalProgressCard
        goal={pagesGoal}
        currentProgress={350}
        remainingDays={10}
        isOnTrack={true}
      />
    )

    expect(screen.getByText('月間ページ目標')).toBeInTheDocument()
    expect(screen.getByText('350 / 1,000ページ')).toBeInTheDocument()
  })
})
```

### 4.2 チャートコンポーネントテスト (`__tests__/components/charts/`)

#### TC-12: 読書進捗チャートテスト (P2)
```typescript
describe('ReadingProgressChart', () => {
  const mockData = [
    { date: '2024-08-18', pagesRead: 20, readingTime: 30, sessionsCount: 1 },
    { date: '2024-08-19', pagesRead: 25, readingTime: 40, sessionsCount: 2 },
    { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 }
  ]

  test('ページ数グラフの描画', () => {
    render(
      <ReadingProgressChart
        data={mockData}
        type="pages"
        timeRange="week"
      />
    )

    // Chart.jsコンポーネントの存在確認
    expect(screen.getByTestId('reading-progress-chart')).toBeInTheDocument()
    
    // データポイントの確認（Chart.jsのcanvas要素）
    const canvas = screen.getByRole('img')
    expect(canvas).toBeInTheDocument()
  })

  test('データタイプ切り替え', async () => {
    const { rerender } = render(
      <ReadingProgressChart
        data={mockData}
        type="pages"
        timeRange="week"
      />
    )

    // ページ数表示
    expect(screen.getByLabelText(/ページ数/)).toBeInTheDocument()

    // 読書時間に切り替え
    rerender(
      <ReadingProgressChart
        data={mockData}
        type="minutes"
        timeRange="week"
      />
    )

    expect(screen.getByLabelText(/読書時間/)).toBeInTheDocument()
  })

  test('空データの場合の表示', () => {
    render(
      <ReadingProgressChart
        data={[]}
        type="pages"
        timeRange="week"
      />
    )

    expect(screen.getByText('データがありません')).toBeInTheDocument()
    expect(screen.getByText('読書記録を追加してください')).toBeInTheDocument()
  })

  test('レスポンシブサイズ調整', () => {
    const { container } = render(
      <ReadingProgressChart
        data={mockData}
        type="pages"
        timeRange="week"
      />
    )

    const chartContainer = container.querySelector('[data-testid="chart-container"]')
    
    // CSSクラスでレスポンシブ設定が適用されていること
    expect(chartContainer).toHaveClass('w-full')
    expect(chartContainer).toHaveClass('h-64', 'md:h-80')
  })

  test('アクセシビリティ属性の設定', () => {
    render(
      <ReadingProgressChart
        data={mockData}
        type="pages"
        timeRange="week"
      />
    )

    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('読書進捗'))
    
    // 代替テキスト（スクリーンリーダー用）
    const chartSummary = screen.getByTestId('chart-summary')
    expect(chartSummary).toHaveClass('sr-only')
    expect(chartSummary).toHaveTextContent(/過去.+日間で計.+ページ/)
  })
})
```

#### TC-13: 書籍分布チャートテスト (P2)
```typescript
describe('BookDistributionChart', () => {
  const mockDistributionData = {
    physical: 15,
    kindle: 20,
    epub: 8,
    audiobook: 5,
    other: 2
  }

  test('ドーナツチャートの描画', () => {
    render(
      <BookDistributionChart
        data={mockDistributionData}
        chartType="doughnut"
      />
    )

    expect(screen.getByTestId('distribution-chart')).toBeInTheDocument()
    
    // 凡例の表示確認
    expect(screen.getByText('物理書籍')).toBeInTheDocument()
    expect(screen.getByText('Kindle')).toBeInTheDocument()
    expect(screen.getByText('15冊')).toBeInTheDocument()
    expect(screen.getByText('20冊')).toBeInTheDocument()
  })

  test('横棒グラフの表示切り替え', () => {
    const { rerender } = render(
      <BookDistributionChart
        data={mockDistributionData}
        chartType="doughnut"
      />
    )

    // 横棒グラフに切り替え
    rerender(
      <BookDistributionChart
        data={mockDistributionData}
        chartType="bar"
      />
    )

    // チャートタイプが変更されていることを確認
    const canvas = screen.getByRole('img')
    expect(canvas).toHaveAttribute('aria-label', expect.stringContaining('横棒'))
  })

  test('読書状態別分布の表示', () => {
    const statusData = {
      want_to_read: 10,
      reading: 5,
      completed: 25,
      paused: 2,
      abandoned: 1
    }

    render(
      <BookDistributionChart
        data={statusData}
        chartType="doughnut"
        dataType="status"
      />
    )

    expect(screen.getByText('読みたい')).toBeInTheDocument()
    expect(screen.getByText('読書中')).toBeInTheDocument()
    expect(screen.getByText('完読')).toBeInTheDocument()
  })

  test('データラベルの日本語表示', () => {
    render(
      <BookDistributionChart
        data={mockDistributionData}
        chartType="doughnut"
      />
    )

    // 日本語ラベルが正しく表示されること
    expect(screen.getByText('物理書籍 (30.0%)')).toBeInTheDocument()
    expect(screen.getByText('Kindle (40.0%)')).toBeInTheDocument()
  })

  test('色覚対応のカラーパレット', () => {
    render(
      <BookDistributionChart
        data={mockDistributionData}
        chartType="doughnut"
      />
    )

    // カラーパレットがアクセシブルであることを確認
    // Chart.jsの設定で色覚対応色が使用されていることをテスト
    const chartElement = screen.getByTestId('distribution-chart')
    expect(chartElement).toHaveAttribute('data-color-palette', 'accessible')
  })
})
```

## 5. パフォーマンステストケース

### 5.1 統計計算パフォーマンステスト (`__tests__/performance/stats-performance.test.ts`)

#### TC-14: 大量データ処理性能テスト (P2)
```typescript
describe('Statistics Performance Tests', () => {
  test('1000冊のデータで統計計算が2秒以内', async () => {
    const user = await createTestUser()
    
    // 大量のテストデータを作成
    const books = []
    for (let i = 0; i < 1000; i++) {
      books.push(createTestUserBook({
        userId: user.id,
        status: i % 3 === 0 ? 'completed' : 'reading',
        book: { pageCount: 200 + (i % 300) }
      }))
    }
    await Promise.all(books)

    const startTime = Date.now()
    const stats = await generateReadingStats(user.id)
    const endTime = Date.now()

    expect(endTime - startTime).toBeLessThan(2000)
    expect(stats.booksCompleted + stats.booksInProgress).toBe(1000)
  }, 10000)

  test('10000セッションのデータでチャート描画が3秒以内', async () => {
    const user = await createTestUser()
    const userBook = await createTestUserBook({ userId: user.id })

    // 大量のセッションデータを作成
    const sessions = []
    for (let i = 0; i < 10000; i++) {
      const sessionDate = new Date()
      sessionDate.setDate(sessionDate.getDate() - (i % 365))
      
      sessions.push(createTestReadingSession({
        userBookId: userBook.id,
        startPage: i * 2 + 1,
        endPage: i * 2 + 3,
        durationMinutes: 15 + (i % 45),
        sessionDate
      }))
    }
    await Promise.all(sessions)

    const startTime = Date.now()
    const dailyStats = await generateDailyStats(user.id, { days: 365 })
    const chartData = transformStatsForChart(dailyStats, 'pages')
    const endTime = Date.now()

    expect(endTime - startTime).toBeLessThan(3000)
    expect(chartData.datasets[0].data.length).toBe(365)
  }, 15000)

  test('メモリリークが発生しない', async () => {
    const user = await createTestUser()
    
    const initialMemory = process.memoryUsage().heapUsed
    
    // 繰り返し統計計算を実行
    for (let i = 0; i < 100; i++) {
      await generateReadingStats(user.id)
      
      // ガベージコレクション実行
      if (global.gc) {
        global.gc()
      }
    }

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory

    // メモリ使用量の増加が100MB未満であることを確認
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
  })

  test('並行アクセス時のレスポンス時間安定性', async () => {
    const users = await Promise.all(
      Array.from({ length: 10 }, () => createTestUser())
    )

    // 各ユーザーにテストデータを作成
    for (const user of users) {
      await createTestUserBook({ userId: user.id })
    }

    const startTime = Date.now()
    
    // 10ユーザーの同時アクセス
    const statsPromises = users.map(user => 
      generateReadingStats(user.id)
    )
    
    const results = await Promise.all(statsPromises)
    const endTime = Date.now()

    // すべてのリクエストが5秒以内に完了
    expect(endTime - startTime).toBeLessThan(5000)
    
    // すべてのレスポンスが正常
    results.forEach(stats => {
      expect(stats.booksInProgress).toBe(1)
    })
  })
})
```

### 5.2 チャート描画パフォーマンステスト (`__tests__/performance/chart-performance.test.ts`)

#### TC-15: チャート描画性能テスト (P3)
```typescript
describe('Chart Performance Tests', () => {
  test('5000データポイントのチャート描画が2秒以内', async () => {
    // 5000日分のデータを作成
    const dailyStats = []
    for (let i = 0; i < 5000; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        pagesRead: Math.floor(Math.random() * 50),
        readingTime: Math.floor(Math.random() * 120),
        sessionsCount: Math.floor(Math.random() * 3)
      })
    }

    const startTime = Date.now()
    
    // チャートデータ変換
    const chartData = transformStatsForChart(dailyStats, 'pages')
    
    // 仮想DOMでの描画テスト
    render(
      <ReadingProgressChart
        data={dailyStats}
        type="pages"
        timeRange="year"
      />
    )
    
    const endTime = Date.now()

    expect(endTime - startTime).toBeLessThan(2000)
    expect(chartData.datasets[0].data.length).toBe(5000)
  })

  test('データ更新時の再描画性能', async () => {
    const initialData = [
      { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 }
    ]

    const { rerender } = render(
      <ReadingProgressChart
        data={initialData}
        type="pages"
        timeRange="week"
      />
    )

    // 大量データに更新
    const updatedData = []
    for (let i = 0; i < 1000; i++) {
      updatedData.push({
        date: `2024-08-${20 - i % 30}`,
        pagesRead: 30 + i,
        readingTime: 45 + i,
        sessionsCount: 2
      })
    }

    const startTime = Date.now()
    rerender(
      <ReadingProgressChart
        data={updatedData}
        type="pages"
        timeRange="year"
      />
    )
    const endTime = Date.now()

    expect(endTime - startTime).toBeLessThan(1000) // 1秒以内の再描画
  })
})
```

## 6. アクセシビリティテストケース

### 6.1 WCAG準拠テスト (`__tests__/accessibility/dashboard-a11y.test.ts`)

#### TC-16: アクセシビリティテスト (P3)
```typescript
describe('Dashboard Accessibility Tests', () => {
  test('キーボードナビゲーションが正常に動作', async () => {
    render(
      <ReadingDashboard 
        userId="test-user"
        statsData={mockStatsData}
      />
    )

    // Tab順序のテスト
    const focusableElements = screen.getAllByRole('button')
    
    // 最初の要素にフォーカス
    focusableElements[0].focus()
    expect(focusableElements[0]).toHaveFocus()

    // Tab キーで次の要素に移動
    await userEvent.tab()
    expect(focusableElements[1]).toHaveFocus()

    // Shift+Tab で前の要素に戻る
    await userEvent.tab({ shift: true })
    expect(focusableElements[0]).toHaveFocus()
  })

  test('フォーカスインジケータの明確化', () => {
    render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    const timeRangeButtons = screen.getAllByRole('button')
    
    timeRangeButtons.forEach(button => {
      button.focus()
      
      // フォーカス時のスタイル確認
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
      expect(button).toHaveClass('focus:ring-blue-500')
    })
  })

  test('ショートカットキーの提供', async () => {
    const mockOnTimeRangeChange = jest.fn()
    render(
      <ReadingDashboard 
        userId="test-user"
        statsData={mockStatsData}
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    )

    // Alt+1 で週表示に切り替え
    await userEvent.keyboard('{Alt>}1{/Alt}')
    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('week')

    // Alt+2 で月表示に切り替え
    await userEvent.keyboard('{Alt>}2{/Alt}')
    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('month')
  })

  test('スクリーンリーダー対応のAria属性', () => {
    render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    // ダッシュボード全体のaria-label
    const dashboard = screen.getByRole('main')
    expect(dashboard).toHaveAttribute('aria-label', '読書統計ダッシュボード')

    // 統計カードのaria-labelledby
    const statsCards = screen.getAllByRole('article')
    statsCards.forEach(card => {
      expect(card).toHaveAttribute('aria-labelledby')
    })

    // チャートの代替テキスト
    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute('aria-describedby')
    
    const chartDescription = screen.getByTestId('chart-description')
    expect(chartDescription).toBeInTheDocument()
    expect(chartDescription).toHaveClass('sr-only')
  })

  test('チャートの代替テキスト生成', () => {
    render(
      <ReadingProgressChart
        data={mockStatsData.dailyStats}
        type="pages"
        timeRange="week"
      />
    )

    const chartSummary = screen.getByTestId('chart-summary')
    
    // 具体的なデータサマリーが含まれること
    expect(chartSummary).toHaveTextContent(/過去7日間で計\d+ページを読み/)
    expect(chartSummary).toHaveTextContent(/平均して1日\d+ページのペースです/)
    expect(chartSummary).toHaveTextContent(/最も多く読んだ日は\d+ページ/)
  })

  test('コントラスト比WCAG AA基準準拠', () => {
    render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    // 文字色のコントラスト比確認（4.5:1以上）
    const textElements = screen.getAllByText(/\d+/)
    textElements.forEach(element => {
      const styles = getComputedStyle(element)
      const color = styles.color
      const backgroundColor = styles.backgroundColor
      
      // 実際のテストでは color-contrast ライブラリを使用
      expect(calculateContrastRatio(color, backgroundColor)).toBeGreaterThanOrEqual(4.5)
    })
  })

  test('チャートの色覚対応', () => {
    render(
      <BookDistributionChart
        data={mockDistributionData}
        chartType="doughnut"
      />
    )

    // 色覚多様性に対応したカラーパレットの使用確認
    const chartElement = screen.getByTestId('distribution-chart')
    
    // データ属性でアクセシブルなカラーパレットが設定されていることを確認
    expect(chartElement).toHaveAttribute('data-accessible-colors', 'true')
  })

  test('文字サイズ・行間の最適化', () => {
    render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    const textElements = screen.getAllByRole('heading')
    
    textElements.forEach(element => {
      const styles = getComputedStyle(element)
      
      // 最小フォントサイズ（16px以上）
      const fontSize = parseInt(styles.fontSize, 10)
      expect(fontSize).toBeGreaterThanOrEqual(16)
      
      // 適切な行間（1.4以上）
      const lineHeight = parseFloat(styles.lineHeight)
      const lineHeightRatio = lineHeight / fontSize
      expect(lineHeightRatio).toBeGreaterThanOrEqual(1.4)
    })
  })
})
```

### 6.2 スクリーンリーダー対応テスト (`__tests__/accessibility/screen-reader.test.ts`)

#### TC-17: スクリーンリーダー対応テスト (P3)
```typescript
describe('Screen Reader Support', () => {
  test('統計データの読み上げテキスト生成', () => {
    render(
      <StatsSummaryCard
        title="総読書時間"
        value={150}
        formatter="minutes"
        trend={{
          value: 15,
          direction: 'up',
          period: '先週比'
        }}
      />
    )

    // aria-label で統合的な情報を提供
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-label', 
      '総読書時間: 2時間30分、先週比15%増加'
    )
  })

  test('チャートデータの構造化された読み上げ', () => {
    render(
      <ReadingProgressChart
        data={mockStatsData.dailyStats}
        type="pages"
        timeRange="week"
      />
    )

    // チャートデータをテーブル形式で提供
    const dataTable = screen.getByRole('table')
    expect(dataTable).toBeInTheDocument()
    expect(dataTable).toHaveClass('sr-only')

    // テーブルヘッダー
    expect(screen.getByRole('columnheader', { name: '日付' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'ページ数' })).toBeInTheDocument()

    // データ行
    const dataRows = screen.getAllByRole('row')
    expect(dataRows.length).toBeGreaterThan(1) // ヘッダー + データ行
  })

  test('動的な内容の変更通知', async () => {
    const { rerender } = render(
      <ReadingDashboard userId="test-user" isLoading={true} />
    )

    // ローディング状態のaria-live
    expect(screen.getByText('統計データを読み込んでいます')).toHaveAttribute('aria-live', 'polite')

    // データ読み込み完了後
    rerender(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

    // 完了通知のaria-live
    expect(screen.getByText('統計データが更新されました')).toHaveAttribute('aria-live', 'polite')
  })

  test('エラー状態の適切な通知', () => {
    render(
      <ReadingDashboard 
        userId="test-user" 
        error="ネットワークエラーが発生しました"
      />
    )

    // エラーメッセージのaria-live="assertive"
    const errorMessage = screen.getByRole('alert')
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive')
    expect(errorMessage).toHaveTextContent('ネットワークエラーが発生しました')
  })
})
```

## 7. エラーハンドリングテストケース

### 7.1 APIエラー処理テスト (`__tests__/error-handling/api-errors.test.ts`)

#### TC-18: APIエラー処理テスト (P1)
```typescript
describe('API Error Handling', () => {
  test('データベース接続エラーの処理', async () => {
    // データベース接続を切断
    await prisma.$disconnect()

    const response = await request(app)
      .get('/api/statistics/dashboard')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(500)

    expect(response.body.error).toBeDefined()
    expect(response.body.error.code).toBe('DATABASE_CONNECTION_ERROR')
    expect(response.body.error.message).toContain('データベースに接続できません')
  })

  test('不正なパラメータのバリデーション', async () => {
    const response = await request(app)
      .get('/api/statistics/dashboard')
      .query({
        days: -1,
        timeRange: 'invalid_range',
        userId: 'not-a-uuid'
      })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(400)

    expect(response.body.error).toBeDefined()
    expect(response.body.error.details).toContain('days must be positive')
    expect(response.body.error.details).toContain('timeRange is invalid')
  })

  test('認証トークンの検証', async () => {
    // 無効なトークン
    await request(app)
      .get('/api/statistics/dashboard')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401)

    // 期限切れトークン
    const expiredToken = generateExpiredJWT()
    await request(app)
      .get('/api/statistics/dashboard')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)

    // トークンなし
    await request(app)
      .get('/api/statistics/dashboard')
      .expect(401)
  })

  test('レート制限の適用', async () => {
    const user = await createTestUser()
    const token = generateTestJWT(user.id)

    // 100回のリクエストを短時間で送信
    const requests = Array.from({ length: 100 }, () =>
      request(app)
        .get('/api/statistics/dashboard')
        .set('Authorization', `Bearer ${token}`)
    )

    const responses = await Promise.allSettled(requests)
    
    // 一部のリクエストが429エラーになることを確認
    const tooManyRequests = responses.filter(
      result => result.status === 'fulfilled' && result.value.status === 429
    )
    
    expect(tooManyRequests.length).toBeGreaterThan(0)
  })

  test('SQLインジェクション対策', async () => {
    const maliciousInput = "'; DROP TABLE user_books; --"
    
    const response = await request(app)
      .get('/api/statistics/dashboard')
      .query({ filter: maliciousInput })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200) // エラーではなく、安全に処理される

    // テーブルが削除されていないことを確認
    const userBooks = await prisma.userBook.findMany()
    expect(userBooks).toBeDefined()
  })

  test('XSS攻撃対策', async () => {
    const xssInput = '<script>alert("xss")</script>'
    
    const goal = await createTestReadingGoal({
      userId: testUserId,
      type: 'books_per_year'
    })

    const response = await request(app)
      .put(`/api/statistics/goals/${goal.id}`)
      .send({ notes: xssInput })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)

    // レスポンスでスクリプトタグがエスケープされていること
    expect(response.body.goal.notes).not.toContain('<script>')
    expect(response.body.goal.notes).toContain('&lt;script&gt;')
  })
})
```

### 7.2 フロントエンドエラー処理テスト (`__tests__/error-handling/frontend-errors.test.ts`)

#### TC-19: フロントエンドエラー処理テスト (P2)
```typescript
describe('Frontend Error Handling', () => {
  test('APIエラー時のフォールバック表示', async () => {
    // APIエラーをモック
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network Error'))

    render(<ReadingDashboard userId="test-user" />)

    // エラー状態の表示確認
    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
    })
  })

  test('部分的なデータエラーの処理', async () => {
    // 一部のAPIが失敗する状況をモック
    const mockFetch = jest.spyOn(global, 'fetch')
    mockFetch
      .mockResolvedValueOnce(createMockResponse(mockStatsData)) // 統計データ成功
      .mockRejectedValueOnce(new Error('Chart data failed')) // チャートデータ失敗

    render(<ReadingDashboard userId="test-user" />)

    await waitFor(() => {
      // 統計サマリーは表示される
      expect(screen.getByText('2時間30分')).toBeInTheDocument()
      
      // チャート部分はエラー表示
      expect(screen.getByText('チャートの表示に失敗しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'チャートを再読み込み' })).toBeInTheDocument()
    })
  })

  test('ネットワーク切断時の対応', async () => {
    // オフライン状態をシミュレート
    Object.defineProperty(navigator, 'onLine', { value: false })

    render(<ReadingDashboard userId="test-user" />)

    expect(screen.getByText('オフラインです')).toBeInTheDocument()
    expect(screen.getByText('インターネット接続を確認してください')).toBeInTheDocument()

    // オンライン復帰のシミュレート
    Object.defineProperty(navigator, 'onLine', { value: true })
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(screen.queryByText('オフラインです')).not.toBeInTheDocument()
    })
  })

  test('コンポーネントエラー境界の動作', () => {
    // エラーを発生させるコンポーネント
    const ThrowError = () => {
      throw new Error('Component Error')
    }

    const consoleError = jest.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    consoleError.mockRestore()
  })

  test('非同期処理のキャンセル', async () => {
    const { unmount } = render(<ReadingDashboard userId="test-user" />)

    // コンポーネントのアンマウント
    unmount()

    // メモリリークやエラーが発生しないことを確認
    await new Promise(resolve => setTimeout(resolve, 100))

    // コンソールエラーが出力されていないことを確認
    expect(jest.spyOn(console, 'error')).not.toHaveBeenCalled()
  })
})
```

## 8. E2Eテストケース（将来実装）

### 8.1 ユーザーシナリオテスト (`e2e/dashboard-flow.spec.ts`)

#### TC-20: 完全なダッシュボードフローテスト (P2)
```typescript
describe('Reading Dashboard E2E', () => {
  test('ログイン後にダッシュボードが表示される', async ({ page }) => {
    // ログイン
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // ダッシュボードへリダイレクト
    await expect(page).toHaveURL('/dashboard')

    // 統計カードの表示確認
    await expect(page.locator('[data-testid="total-reading-time"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-pages-read"]')).toBeVisible()
    await expect(page.locator('[data-testid="books-completed"]')).toBeVisible()
    
    // チャートの表示確認
    await expect(page.locator('[data-testid="reading-progress-chart"]')).toBeVisible()
  })

  test('読書目標の設定から追跡まで一連の操作', async ({ page }) => {
    await page.goto('/dashboard')

    // 目標設定ボタンをクリック
    await page.click('[data-testid="set-goal-button"]')

    // 目標設定モーダルの入力
    await page.selectOption('[data-testid="goal-type"]', 'books_per_year')
    await page.fill('[data-testid="target-value"]', '50')
    await page.click('[data-testid="save-goal-button"]')

    // 目標カードが表示されることを確認
    await expect(page.locator('[data-testid="goal-progress-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="goal-target"]')).toHaveText('50冊')

    // 読書記録追加
    await page.click('[data-testid="add-reading-session"]')
    await page.fill('[data-testid="pages-read"]', '30')
    await page.fill('[data-testid="reading-time"]', '45')
    await page.click('[data-testid="save-session"]')

    // 目標進捗が更新されることを確認
    await expect(page.locator('[data-testid="goal-progress-bar"]')).toBeVisible()
  })

  test('統計データのリアルタイム更新', async ({ page, context }) => {
    await page.goto('/dashboard')

    // 現在の統計値を記録
    const initialPages = await page.textContent('[data-testid="total-pages-read"]')

    // 新しいタブで読書記録を追加
    const newPage = await context.newPage()
    await newPage.goto('/library')
    await newPage.click('[data-testid="add-progress"]')
    await newPage.fill('[data-testid="current-page"]', '150')
    await newPage.click('[data-testid="save-progress"]')

    // 元のダッシュボードタブに戻る
    await page.bringToFront()

    // 統計が自動更新されることを確認
    await expect(page.locator('[data-testid="total-pages-read"]')).not.toHaveText(initialPages)
  })

  test('モバイル端末でのタッチ操作', async ({ page }) => {
    // モバイル表示に変更
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')

    // スワイプでチャート期間変更
    const chart = page.locator('[data-testid="reading-progress-chart"]')
    
    // 左スワイプ（次の期間）
    await chart.touchstart({ touches: [{ clientX: 300, clientY: 200 }] })
    await chart.touchmove({ touches: [{ clientX: 100, clientY: 200 }] })
    await chart.touchend()

    // 期間が変更されることを確認
    await expect(page.locator('[data-testid="time-range-indicator"]')).toContainText('月')

    // タップでカード詳細表示
    await page.tap('[data-testid="total-reading-time"]')
    await expect(page.locator('[data-testid="reading-time-details"]')).toBeVisible()
  })
})
```

## 9. テストデータ・ユーティリティ

### 9.1 テストデータファクトリー (`__tests__/fixtures/stats-data.ts`)

```typescript
export const createTestReadingGoal = async (overrides: Partial<ReadingGoal> = {}) => {
  return await prisma.readingGoal.create({
    data: {
      userId: 'test-user',
      type: 'books_per_year',
      targetValue: 50,
      currentValue: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
      ...overrides
    }
  })
}

export const createStatsTestData = async (userId: string, options: {
  booksCount?: number
  sessionsPerBook?: number
  timespan?: number // days
} = {}) => {
  const { 
    booksCount = 10, 
    sessionsPerBook = 5, 
    timespan = 30 
  } = options

  const books = []
  for (let i = 0; i < booksCount; i++) {
    const book = await createTestUserBook({
      userId,
      status: i < booksCount / 2 ? 'completed' : 'reading',
      book: {
        pageCount: 200 + Math.floor(Math.random() * 300)
      }
    })
    books.push(book)

    // 各書籍にセッションを作成
    for (let j = 0; j < sessionsPerBook; j++) {
      const sessionDate = new Date()
      sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * timespan))

      await createTestReadingSession({
        userBookId: book.id,
        startPage: j * 20 + 1,
        endPage: (j + 1) * 20,
        durationMinutes: 30 + Math.floor(Math.random() * 60),
        sessionDate
      })
    }
  }

  return books
}

export const mockChartData = {
  dailyStats: [
    { date: '2024-08-18', pagesRead: 25, readingTime: 40, sessionsCount: 1 },
    { date: '2024-08-19', pagesRead: 30, readingTime: 45, sessionsCount: 2 },
    { date: '2024-08-20', pagesRead: 20, readingTime: 30, sessionsCount: 1 }
  ],
  distributionData: {
    physical: 15,
    kindle: 20,
    epub: 8,
    audiobook: 5,
    other: 2
  }
}
```

### 9.2 テスト設定・ヘルパー (`__tests__/helpers/stats-helpers.ts`)

```typescript
export const setupStatsTestEnvironment = async () => {
  // テストデータベースの準備
  await prisma.readingSession.deleteMany()
  await prisma.userBook.deleteMany()
  await prisma.book.deleteMany()
  await prisma.readingGoal.deleteMany()
  await prisma.userProfile.deleteMany()

  // テスト用ユーザー作成
  const testUser = await prisma.userProfile.create({
    data: {
      id: 'test-user',
      name: 'Test User',
      theme: 'light',
      displayMode: 'grid'
    }
  })

  return testUser
}

export const cleanupStatsTestEnvironment = async () => {
  await prisma.readingSession.deleteMany()
  await prisma.userBook.deleteMany()
  await prisma.book.deleteMany()
  await prisma.readingGoal.deleteMany()
  await prisma.userProfile.deleteMany()
}

export const waitForStatsCalculation = async (callback: () => Promise<any>, timeout = 5000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      const result = await callback()
      if (result) return result
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Stats calculation timeout')
}

// アクセシビリティテスト用ヘルパー
export const calculateContrastRatio = (foreground: string, background: string): number => {
  // 色のコントラスト比計算ロジック
  // 実装は color-contrast ライブラリを使用
  return 4.5 // プレースホルダー
}
```

## 10. テスト実行・CI設定

### 10.1 テスト実行スクリプト (`package.json`)

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest __tests__/lib __tests__/hooks",
    "test:integration": "jest __tests__/api",
    "test:components": "jest __tests__/components",
    "test:e2e": "playwright test",
    "test:performance": "jest __tests__/performance --detectOpenHandles",
    "test:a11y": "jest __tests__/accessibility",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:stats": "jest --testPathPattern=stats"
  }
}
```

### 10.2 Jest設定 (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  collectCoverageFrom: [
    'lib/services/reading-stats.ts',
    'hooks/useReadingGoals.ts',
    'components/dashboard/**/*.tsx',
    'components/charts/**/*.tsx',
    'app/api/statistics/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'lib/services/reading-stats.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testTimeout: 10000
}
```

## 11. テスト実行計画

### 11.1 優先度別実行順序

**Phase 1: 基盤テスト (P1)**
1. 統計計算ロジックテスト (TC-01 ~ TC-03)
2. 読書目標管理テスト (TC-04)  
3. APIエンドポイントテスト (TC-06 ~ TC-07)
4. エラーハンドリングテスト (TC-18)

**Phase 2: UI/UXテスト (P2)**
1. ダッシュボードコンポーネントテスト (TC-09 ~ TC-11)
2. チャートコンポーネントテスト (TC-12 ~ TC-13)
3. パフォーマンステスト (TC-14 ~ TC-15)

**Phase 3: 品質保証テスト (P3)**
1. アクセシビリティテスト (TC-16 ~ TC-17)
2. E2Eテスト (TC-20)

### 11.2 継続的インテグレーション

- **プルリクエスト時**: P1テストの実行必須
- **マージ前**: 全テストの実行
- **デプロイ前**: E2Eテスト + パフォーマンステスト
- **定期実行**: 週次でアクセシビリティテスト

この包括的なテストケースにより、TASK-202の読書統計・ダッシュボード機能の品質と信頼性を確保し、TDD開発プロセスを効果的にサポートします。