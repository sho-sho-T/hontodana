# 設定ファイル解説

## biome.json
BiomeのLinter・Formatter設定

### 主要設定項目

#### VCS統合
- `vcs.enabled: false` - Git統合を無効化（現在は無効）
- `vcs.clientKind: "git"` - Gitクライアントを指定
- `vcs.useIgnoreFile: false` - .gitignoreファイルを使用しない

#### ファイル処理
- `files.ignoreUnknown: false` - 未知のファイル拡張子を無視しない
- `files.ignore: []` - 無視するファイル/ディレクトリパターン

#### フォーマッター
- `formatter.enabled: true` - フォーマッター機能を有効化
- `formatter.indentStyle: "tab"` - インデントにタブを使用
- `formatter.indentWidth: 2` - インデント幅
- `formatter.lineEnding: "lf"` - 行末文字（LF）
- `formatter.lineWidth: 80` - 1行の最大文字数

#### インポート整理
- `organizeImports.enabled: true` - インポート文の自動整理を有効化

#### リンター
- `linter.enabled: true` - リンター機能を有効化
- `rules.recommended: true` - 推奨ルールセットを適用

##### 正確性チェック
- `correctness.noUnusedVariables: "error"` - 未使用変数はエラー
- `correctness.useExhaustiveDependencies: "warn"` - React Hook依存配列の網羅性チェック

##### スタイルルール
- `style.noNonNullAssertion: "off"` - non-null assertion(!)を許可
- `style.useImportType: "error"` - 型のみのインポートは import type を強制

##### 疑わしいコードパターンの検出
- `suspicious.noExplicitAny: "warn"` - any型の使用を警告
- `suspicious.noArrayIndexKey: "warn"` - 配列インデックスをReactキーに使用することを警告

#### JavaScript/TypeScript設定
- `javascript.formatter.quoteStyle: "double"` - ダブルクォートを使用
- `javascript.formatter.jsxQuoteStyle: "double"` - JSXでもダブルクォートを使用
- `javascript.formatter.quoteProperties: "asNeeded"` - 必要な場合のみプロパティをクォート
- `javascript.formatter.trailingCommas: "es5"` - ES5準拠の末尾カンマ
- `javascript.formatter.semicolons: "always"` - セミコロンを常に付与
- `javascript.formatter.arrowParentheses: "always"` - アロー関数の引数を常に括弧で囲む
- `javascript.formatter.bracketSpacing: true` - オブジェクトリテラル内でスペースを挿入
- `javascript.formatter.bracketSameLine: false` - 最後の要素と閉じ括弧を別行に
- `javascript.formatter.attributePosition: "auto"` - JSX属性の位置を自動調整

#### JSON設定
- `json.formatter.indentStyle: "tab"` - JSONファイルでもタブインデント
- `json.formatter.indentWidth: 2` - インデント幅

#### CSS設定
- `css.formatter.enabled: true` - CSSフォーマッターを有効化
- `css.formatter.quoteStyle: "double"` - CSSでダブルクォートを使用
- `css.linter.enabled: true` - CSSリンターを有効化

## next.config.ts
Next.js設定

### 主要設定項目

#### 実験的機能
- `experimental.optimizePackageImports` - パッケージのインポートを最適化してバンドルサイズを削減
  - `["lucide-react", "@radix-ui/react-icons"]` - 対象パッケージ

#### 画像最適化
- `images.remotePatterns` - 外部画像ソースの許可設定（Google Books APIからの書影取得用）
  - `protocol: "https"` - HTTPS通信のみ許可
  - `hostname: "books.google.com"` - Google Booksドメインを許可
  - `pathname: "/books/**"` - Google Books APIの書影URLパターン

#### TypeScript設定
- `typescript.ignoreBuildErrors: false` - 型チェックエラーがあってもビルドを継続しない

#### ESLint設定
- `eslint.ignoreDuringBuilds: true` - BiomeでLintingを行うためESLintは無効

## tsconfig.json
TypeScript設定

### 主要設定項目

#### コンパイル設定
- `target: "ES2017"` - コンパイル対象のJavaScript仕様
- `lib: ["dom", "dom.iterable", "esnext"]` - 利用可能なライブラリの定義
- `allowJs: true` - JavaScriptファイルのコンパイルを許可
- `skipLibCheck: true` - 型定義ファイルの型チェックをスキップ（ビルド速度向上）
- `strict: true` - 厳格な型チェックを有効化

#### モジュール設定
- `module: "esnext"` - モジュールシステム（ES Modules）
- `moduleResolution: "bundler"` - モジュール解決方式（Bundler方式）
- `esModuleInterop: true` - CommonJSとES Modulesの相互運用を有効化

#### JSX設定
- `jsx: "preserve"` - JSXの処理方式（Next.jsに委任）

#### パフォーマンス
- `noEmit: true` - JavaScriptファイルを出力しない（Next.jsが処理）
- `incremental: true` - インクリメンタルコンパイルを有効化（ビルド速度向上）
- `isolatedModules: true` - 各ファイルを独立したモジュールとして扱う

#### パスエイリアス
- `paths."@/*": ["./*"]` - @/でプロジェクトルートを参照

#### プラグイン
- `plugins[0].name: "next"` - Next.js TypeScriptプラグイン