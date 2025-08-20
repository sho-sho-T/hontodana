/**
 * 検索履歴管理クラス
 * TODO: 実装予定（TDD Red Phase）
 */

export class SearchHistory {
  private static readonly STORAGE_KEY = 'hontodana-search-history';
  private static readonly MAX_HISTORY = 10;

  /**
   * 検索履歴に新しいキーワードを追加
   */
  add(keyword: string): void {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const current = this.getAll();
    const filtered = current.filter(item => item !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, SearchHistory.MAX_HISTORY);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SearchHistory.STORAGE_KEY, JSON.stringify(updated));
    }
  }

  /**
   * 検索履歴を取得（新しい順）
   */
  getAll(): string[] {
    if (typeof localStorage === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(SearchHistory.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * 検索履歴をクリア
   */
  clear(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SearchHistory.STORAGE_KEY);
    }
  }

  /**
   * 特定のキーワードを削除
   */
  remove(keyword: string): void {
    const current = this.getAll();
    const updated = current.filter(item => item !== keyword);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SearchHistory.STORAGE_KEY, JSON.stringify(updated));
    }
  }
}