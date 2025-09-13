# クリーンアーキテクチャ移行設計書

## 概要

本書は、hontodanaアプリケーションを現在のアーキテクチャから**依存性逆転の原則**に基づくクリーンアーキテクチャに移行するための設計書です。

## 設計書の構成

### 📋 [01. クリーンアーキテクチャ設計原則](./01_clean_architecture_principles.md)
- 依存性逆転の原則の詳細説明
- 各層の責務と依存関係
- Next.js との統合パターン
- テスタビリティの向上方法

### 🚀 [02. 移行計画](./02_migration_plan.md)
- Strangler Fig Pattern による段階的移行戦略
- 4段階の移行フェーズ（Foundation → Core Migration → UI Refactoring → Infrastructure）
- 8週間の詳細スケジュール
- リスク軽減策

### 📁 [03. ディレクトリ構造](./03_directory_structure.md)
- 新しいクリーンアーキテクチャのディレクトリ構成
- 依存関係の流れの可視化
- ファイル命名規則
- モジュール構成とパッケージ設定

### 💻 [04. 実装例](./04_implementation_examples.md)
- Domain Layer の具体的実装（Entity、Value Object、Repository Interface）
- Application Layer の Use Case とCommand/Result パターン
- Infrastructure Layer の Repository 実装とData Mapper
- Presentation Layer の Custom Hook とReact Component
- テストコードの実装例

## 移行の核心原則

### 🎯 最重要原則：依存性は内側だけに向かう

```
Infrastructure → Interface Adapters → Application → Domain
（外側）                                        （内側）
```

### 🏗️ 4層アーキテクチャ

1. **Domain Layer（最内層）**: ビジネスルールの中核
2. **Application Layer**: ユースケースの実装
3. **Interface Adapters Layer**: データ変換とフロー制御
4. **Infrastructure Layer（最外層）**: 技術的詳細

## 移行のメリット

### 🔧 保守性の向上
- 各層の責務が明確
- 変更の影響範囲が限定的
- コードの可読性向上

### 🧪 テスタビリティの向上
- ドメインロジックの単体テストが容易
- モックを使った統合テストの実装
- テスト駆動開発の推進

### 📈 拡張性の確保
- 新機能追加時の設計ガイドラインが明確
- 技術スタックの変更が容易
- マイクロサービス化への移行パス

### 🔄 再利用性の向上
- ビジネスロジックがフレームワークに依存しない
- 他プラットフォームでの再利用が可能
- APIとWebアプリで共通ロジックを共有

## 実装の段階的アプローチ

### Phase 1: Foundation（Week 1-2）
```bash
# 新しいディレクトリ構造を作成
mkdir -p src/{domain,application,infrastructure,presentation}

# Domain Layer の実装
- エンティティ（Book, User, Wishlist）
- 値オブジェクト（BookId, Rating, Progress）
- Repository インターフェース
```

### Phase 2: Core Migration（Week 3-4）
```typescript
// Use Case の実装例
export class AddBookToLibraryUseCase {
  constructor(
    private bookRepository: BookRepository, // Interface依存
    private userRepository: UserRepository  // Interface依存
  ) {}
  
  async execute(command: AddBookCommand): Promise<AddBookResult> {
    // ドメインロジックの組み合わせ
  }
}
```

### Phase 3: UI Refactoring（Week 5-6）
```typescript
// 責務分離されたHook
export const useBookActions = () => {
  const container = DIContainer.getInstance();
  
  return useMutation({
    mutationFn: (command: AddBookCommand) => {
      const useCase = container.get<AddBookToLibraryUseCase>('addBookUseCase');
      return useCase.execute(command);
    }
  });
};
```

### Phase 4: Infrastructure（Week 7-8）
```typescript
// Repository実装
export class PrismaBookRepository implements BookRepository {
  constructor(private prisma: PrismaClient) {}
  
  async save(book: Book): Promise<Book> {
    const data = BookMapper.toPersistence(book);
    // Prisma操作
  }
}
```

## 継続的な改善

### 📊 メトリクス監視
- コードカバレッジ
- 循環的複雑度
- 依存関係の健全性

### 👥 チーム教育
- アーキテクチャ勉強会
- コードレビューガイドライン
- ペアプログラミング

### 🔍 品質保証
- アーキテクチャテスト
- 静的解析ツール
- 継続的リファクタリング

## 次のステップ

1. **設計書の詳細確認**: 各章を順番に読み、理解を深める
2. **移行計画の承認**: ステークホルダーとの合意形成
3. **Phase 1の開始**: Domain Layer の実装から着手
4. **継続的な評価**: 各フェーズ完了時の振り返りと調整

---

**注意**: この移行は段階的に行い、既存機能を壊さないよう細心の注意を払って実行してください。各フェーズで十分なテストを実施し、問題があれば即座にロールバックできる体制を整えておくことが重要です。