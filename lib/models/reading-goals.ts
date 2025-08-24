/**
 * 読書目標管理に関する型定義
 */

export interface ReadingGoal {
  id: string
  userId: string
  type: 'books_per_year' | 'books_per_month' | 'pages_per_month' | 'pages_per_year' | 'reading_time_per_day'
  targetValue: number
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateGoalInput {
  type: ReadingGoal['type']
  targetValue: number
  startDate: Date
  endDate: Date
}

export interface UpdateGoalInput {
  targetValue?: number
  startDate?: Date
  endDate?: Date
  isActive?: boolean
}

export interface GoalProgress {
  currentValue: number
  progressPercentage: number
  remainingToTarget: number
  isOnTrack: boolean
  isCompleted: boolean
  isExpired: boolean
  dailyTargetToFinish?: number
  daysRemaining?: number
}

export interface GoalAlert {
  goalId: string
  type: 'behind_schedule' | 'ahead_of_schedule' | 'deadline_approaching' | 'completed'
  severity: 'info' | 'warning' | 'error' | 'success'
  message: string
  actionRequired: boolean
}

export interface ReadingGoalsHookReturn {
  goals: ReadingGoal[]
  activeGoals: ReadingGoal[]
  isLoading: boolean
  error: Error | null
  createGoal: (goalData: CreateGoalInput) => Promise<ReadingGoal>
  updateGoal: (goalId: string, updates: UpdateGoalInput) => Promise<ReadingGoal>
  deleteGoal: (goalId: string) => Promise<void>
  calculateProgress: (goal: ReadingGoal) => GoalProgress
  getGoalAlerts: () => GoalAlert[]
  refreshGoals: () => Promise<void>
}