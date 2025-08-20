import { SearchHistory } from '@/lib/utils/search-history';

// LocalStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SearchHistory', () => {
  let history: SearchHistory;

  beforeEach(() => {
    history = new SearchHistory();
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('検索履歴の保存', () => {
    history.add('JavaScript');
    expect(history.getAll()).toContain('JavaScript');
  });

  test('重複検索語の処理', () => {
    history.add('JavaScript');
    history.add('JavaScript');
    expect(history.getAll().filter(h => h === 'JavaScript')).toHaveLength(1);
  });

  test('検索履歴の上限管理', () => {
    for (let i = 0; i < 15; i++) {
      history.add(`keyword${i}`);
    }
    expect(history.getAll()).toHaveLength(10);
  });

  test('最新の検索語が先頭に来る', () => {
    history.add('first');
    history.add('second');
    history.add('third');
    const all = history.getAll();
    expect(all[0]).toBe('third');
    expect(all[2]).toBe('first');
  });

  test('空文字列は追加されない', () => {
    history.add('');
    history.add('   ');
    expect(history.getAll()).toHaveLength(0);
  });

  test('検索履歴のクリア', () => {
    history.add('test1');
    history.add('test2');
    history.clear();
    expect(history.getAll()).toHaveLength(0);
  });

  test('特定のキーワードの削除', () => {
    history.add('test1');
    history.add('test2');
    history.add('test3');
    history.remove('test2');
    const remaining = history.getAll();
    expect(remaining).not.toContain('test2');
    expect(remaining).toContain('test1');
    expect(remaining).toContain('test3');
  });

  test('既存の履歴を上書き（重複時）', () => {
    history.add('first');
    history.add('second');
    history.add('first'); // 重複
    const all = history.getAll();
    expect(all[0]).toBe('first'); // 最新に移動
    expect(all).toHaveLength(2);
  });
});