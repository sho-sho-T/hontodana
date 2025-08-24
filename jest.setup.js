import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      query: {},
      pathname: '/',
      route: '/',
      asPath: '/',
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock Request and Response
global.Request = jest.fn()
global.Response = jest.fn()
global.Headers = jest.fn()

// Add Node.js polyfills for Next.js
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Setup environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userBook: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    book: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    readingSession: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
    },
    userProfile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    readingGoal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  },
}))

// Mock Heroicons - doMockを使用してhoist問題を回避
jest.doMock('@heroicons/react/24/outline', () => ({
  BookOpenIcon: () => '<svg>BookOpen</svg>',
  ChartBarIcon: () => '<svg>ChartBar</svg>',
  ClockIcon: () => '<svg>Clock</svg>',
  TrendingUpIcon: () => '<svg>TrendingUp</svg>',
  ExclamationTriangleIcon: () => '<svg>ExclamationTriangle</svg>',
  CheckCircleIcon: () => '<svg>CheckCircle</svg>',
}), { virtual: true })

// Mock useReadingGoals hook
jest.mock('@/hooks/useReadingGoals', () => ({
  useReadingGoals: jest.fn().mockReturnValue({
    goals: [],
    activeGoals: [],
    isLoading: false,
    error: null,
    calculateProgress: jest.fn().mockReturnValue({
      currentValue: 0,
      progressPercentage: 0,
      remainingDays: 0,
      isOnTrack: true,
    }),
    getGoalAlerts: jest.fn().mockReturnValue([]),
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
    refreshGoals: jest.fn(),
  }),
}))