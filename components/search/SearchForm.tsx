/**
 * 検索フォームコンポーネント
 */

import React from 'react';
import type { SearchFilters } from '@/lib/utils/search-utils';

interface SearchFormProps {
  onSearch: (params: { query: string; filters: SearchFilters }) => void;
  initialQuery?: string;
  initialFilters?: SearchFilters;
  isLoading?: boolean;
}

export function SearchForm({ onSearch, initialQuery = '', initialFilters = {}, isLoading = false }: SearchFormProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [filters, setFilters] = React.useState(initialFilters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, filters });
  };

  const handleClear = () => {
    setQuery('');
    setFilters({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch({ query, filters });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="書籍を検索..." 
          aria-label="書籍検索" 
        />
        <button type="submit" disabled={isLoading}>検索</button>
        <button type="button" onClick={handleClear}>クリア</button>
      </div>
      <div>
        <label htmlFor="status-filter">読書状態</label>
        <select 
          id="status-filter"
          aria-label="読書状態"
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
        >
          <option value="">すべて</option>
          <option value="want_to_read">読みたい</option>
          <option value="reading">読書中</option>
          <option value="completed">読了</option>
          <option value="paused">中断中</option>
          <option value="abandoned">中止</option>
          <option value="reference">参考書</option>
        </select>
      </div>
    </form>
  );
}