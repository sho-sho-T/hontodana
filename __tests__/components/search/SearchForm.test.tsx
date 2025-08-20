import { render, screen, fireEvent } from '@testing-library/react';
import { SearchForm } from '@/components/search/SearchForm';

describe('SearchForm', () => {
  test('検索キーワード入力', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('書籍を検索...');
    fireEvent.change(input, { target: { value: 'JavaScript' } });
    fireEvent.click(screen.getByRole('button', { name: '検索' }));
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'JavaScript',
      filters: {}
    });
  });

  test('初期値の設定', () => {
    const mockOnSearch = jest.fn();
    render(
      <SearchForm 
        onSearch={mockOnSearch}
        initialQuery="初期キーワード"
      />
    );
    
    const input = screen.getByPlaceholderText('書籍を検索...');
    expect(input).toHaveValue('初期キーワード');
  });

  test('Enterキーでの検索実行', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('書籍を検索...');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'React',
      filters: {}
    });
  });

  test('ローディング状態の表示', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={true} />);
    
    const button = screen.getByRole('button', { name: '検索' });
    expect(button).toBeDisabled();
  });

  test('フィルタ条件の設定', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} />);
    
    // 読書状態フィルタを設定
    const statusSelect = screen.getByLabelText('読書状態');
    fireEvent.change(statusSelect, { target: { value: 'reading' } });
    fireEvent.click(screen.getByRole('button', { name: '検索' }));
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: '',
      filters: { status: 'reading' }
    });
  });

  test('検索条件のクリア', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} />);
    
    // 検索キーワードを入力
    const input = screen.getByPlaceholderText('書籍を検索...');
    fireEvent.change(input, { target: { value: 'JavaScript' } });
    
    // フィルタを設定
    const statusSelect = screen.getByLabelText('読書状態');
    fireEvent.change(statusSelect, { target: { value: 'reading' } });
    
    // クリアボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'クリア' }));
    
    expect(input).toHaveValue('');
    expect(statusSelect).toHaveValue('');
  });
});