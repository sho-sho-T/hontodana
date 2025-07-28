# CI/CD設計書

## 1. CI/CDパイプライン全体概要

### 1.1 パイプライン戦略
- **継続的インテグレーション（CI）**: コード品質の自動検証
- **継続的デプロイメント（CD）**: 自動デプロイ・リリース管理
- **段階的デプロイ**: development → staging → production
- **ロールバック対応**: 問題発生時の迅速な復旧

### 1.2 ツール構成
- **CI/CD Platform**: GitHub Actions
- **コード品質**: ESLint, Prettier, TypeScript
- **テスト**: Jest, Playwright
- **デプロイ**: Vercel (Frontend), Supabase (Backend)
- **監視**: Vercel Analytics, Sentry

## 2. GitHub Actions ワークフロー設計

### 2.1 メインワークフロー
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  lint-and-format:
    name: Lint and Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Check Prettier formatting
        run: pnpm format:check

      - name: TypeScript type check
        run: pnpm type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint-and-format
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test database
        run: |
          npx supabase start --db-port 5432
          npx supabase db reset --local
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run unit tests
        run: pnpm test:unit --coverage
        env:
          CI: true

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint-and-format, test]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/

  e2e-test:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: .next/

      - name: Start application
        run: pnpm start &
        env:
          NODE_ENV: test

      - name: Wait for application
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### 2.2 デプロイワークフロー
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main
      - develop
  release:
    types: [published]

jobs:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          scope: ${{ secrets.TEAM_ID }}

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--env staging'
          scope: ${{ secrets.TEAM_ID }}

      - name: Run smoke tests
        run: |
          npx playwright test --grep "@smoke" --config=playwright.staging.config.ts
        env:
          PLAYWRIGHT_BASE_URL: ${{ steps.deploy.outputs.preview-url }}

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.TEAM_ID }}

      - name: Update Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        with:
          environment: production
          version: ${{ github.ref_name }}

      - name: Send deployment notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          text: 'Production deployment completed! :rocket:'
```

### 2.3 セキュリティスキャンワークフロー
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1' # 毎週月曜日 2:00 AM

jobs:
  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  code-scan:
    name: Code Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

## 3. デプロイメント戦略

### 3.1 環境構成
```typescript
// 環境別設定
interface EnvironmentConfig {
  development: {
    database: 'postgresql://localhost:54322/postgres';
    apiUrl: 'http://localhost:3000/api';
    logLevel: 'debug';
    enableDevTools: true;
  };
  staging: {
    database: process.env.STAGING_DATABASE_URL;
    apiUrl: 'https://staging.hontodana.com/api';
    logLevel: 'info';
    enableDevTools: false;
  };
  production: {
    database: process.env.DATABASE_URL;
    apiUrl: 'https://hontodana.com/api';
    logLevel: 'error';
    enableDevTools: false;
  };
}
```

### 3.2 Vercel設定
```json
// vercel.json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["nrt1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "GOOGLE_BOOKS_API_KEY": "@google-books-api-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

## 4. ブランチ戦略

### 4.1 Git Flow戦略
```
main (production)
├── release/v1.0.0
├── develop (staging)
│   ├── feature/book-management
│   ├── feature/user-auth
│   └── feature/social-features
└── hotfix/critical-bug-fix
```

### 4.2 プルリクエストテンプレート
```markdown
<!-- .github/pull_request_template.md -->
## 変更内容

### 概要
<!-- 変更内容の概要を記述 -->

### 変更理由
<!-- なぜこの変更が必要なのかを説明 -->

### 変更詳細
- [ ] 新機能追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新
- [ ] テスト追加

## テスト

### テスト内容
- [ ] 単体テスト追加・更新
- [ ] 統合テスト追加・更新
- [ ] E2Eテスト追加・更新
- [ ] 手動テスト実施

### 確認事項
- [ ] ローカル環境での動作確認
- [ ] レスポンシブデザインの確認
- [ ] 既存機能への影響確認

## チェックリスト

- [ ] コードレビュー済み
- [ ] テストが通ることを確認
- [ ] ドキュメント更新（必要に応じて）
- [ ] 破壊的変更がある場合は明記
```

## 5. リリース管理

### 5.1 セマンティックバージョニング
```json
// package.json
{
  "scripts": {
    "release:patch": "standard-version --release-as patch",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:alpha": "standard-version --prerelease alpha",
    "release:beta": "standard-version --prerelease beta"
  }
}
```

### 5.2 CHANGELOG自動生成
```js
// .versionrc.js
module.exports = {
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'perf', section: '⚡ Performance Improvements' },
    { type: 'revert', section: '⏪ Reverts' },
    { type: 'docs', section: '📚 Documentation', hidden: false },
    { type: 'style', section: '💄 Styles', hidden: true },
    { type: 'refactor', section: '♻️ Code Refactoring', hidden: true },
    { type: 'test', section: '✅ Tests', hidden: true },
    { type: 'build', section: '📦 Build System', hidden: true },
    { type: 'ci', section: '👷 CI/CD', hidden: true },
  ],
  commitUrlFormat: 'https://github.com/username/hontodana/commit/{{hash}}',
  compareUrlFormat: 'https://github.com/username/hontodana/compare/{{previousTag}}...{{currentTag}}',
};
```

## 6. 監視・ログ設定

### 6.1 ヘルスチェックエンドポイント
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // データベース接続確認
    const dbHealth = await checkDatabaseHealth();
    
    // 外部API接続確認
    const apiHealth = await checkExternalAPIs();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      database: dbHealth,
      externalAPIs: apiHealth,
      uptime: process.uptime(),
    };
    
    return Response.json(health);
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}

async function checkDatabaseHealth() {
  // Supabaseヘルスチェック
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);
    
  return {
    status: error ? 'unhealthy' : 'healthy',
    responseTime: Date.now(),
  };
}
```

### 6.2 エラー監視設定
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // 機密情報のフィルタリング
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  },
});

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      component: context?.component || 'unknown',
    },
  });
}
```

## 7. パフォーマンス監視

### 7.1 Core Web Vitals監視
```typescript
// lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Vercel Analytics
  if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID) {
    window.va?.track('web-vitals', {
      name: metric.name,
      value: metric.value,
      label: metric.label,
    });
  }
  
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

export function initWebVitals() {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
}
```

## 8. ロールバック戦略

### 8.1 自動ロールバック設定
```yaml
# .github/workflows/rollback.yml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true
        type: string

jobs:
  rollback:
    name: Rollback to Previous Version
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout specific version
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - name: Deploy rollback version
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.TEAM_ID }}

      - name: Verify rollback
        run: |
          # ヘルスチェック実行
          curl -f https://hontodana.com/api/health
          
          # E2Eテスト実行
          npx playwright test --grep "@critical"

      - name: Notify rollback completion
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          text: 'Rollback to ${{ github.event.inputs.version }} completed'
```

## 9. データベースマイグレーション

### 9.1 Supabaseマイグレーション管理
```bash
# scripts/migrate.sh
#!/bin/bash

ENVIRONMENT=${1:-development}

case $ENVIRONMENT in
  "development")
    echo "Running migrations on development..."
    supabase db reset --local
    ;;
  "staging")
    echo "Running migrations on staging..."
    supabase db push --project-ref $STAGING_PROJECT_REF
    ;;
  "production")
    echo "Running migrations on production..."
    # 本番環境は手動承認が必要
    read -p "Are you sure you want to run migrations on production? (y/N): " confirm
    if [[ $confirm == [yY] ]]; then
      supabase db push --project-ref $PRODUCTION_PROJECT_REF
    fi
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac
```

### 9.2 マイグレーション検証
```typescript
// scripts/validate-migration.ts
import { createClient } from '@supabase/supabase-js';

interface MigrationValidation {
  tableName: string;
  expectedColumns: string[];
  expectedIndexes: string[];
}

const validations: MigrationValidation[] = [
  {
    tableName: 'users',
    expectedColumns: ['id', 'email', 'username', 'created_at', 'updated_at'],
    expectedIndexes: ['idx_users_email', 'idx_users_username'],
  },
  {
    tableName: 'books',
    expectedColumns: ['id', 'user_id', 'title', 'author', 'created_at'],
    expectedIndexes: ['idx_books_user_id', 'idx_books_title'],
  },
];

export async function validateMigrations() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const validation of validations) {
    await validateTable(supabase, validation);
  }
  
  console.log('All migrations validated successfully');
}

async function validateTable(supabase: any, validation: MigrationValidation) {
  // テーブル存在確認
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', validation.tableName);

  if (!tables?.length) {
    throw new Error(`Table ${validation.tableName} does not exist`);
  }

  // カラム確認
  const { data: columns } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', validation.tableName);

  const columnNames = columns?.map(c => c.column_name) || [];
  
  for (const expectedColumn of validation.expectedColumns) {
    if (!columnNames.includes(expectedColumn)) {
      throw new Error(`Column ${expectedColumn} missing in ${validation.tableName}`);
    }
  }

  console.log(`✓ Table ${validation.tableName} validated`);
}
```

この包括的なCI/CD設計により、安全で効率的なデプロイメントプロセスを実現できます。