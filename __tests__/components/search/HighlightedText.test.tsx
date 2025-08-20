import { render, screen } from '@testing-library/react';
import { HighlightedText } from '@/components/search/HighlightedText';

describe('HighlightedText', () => {
  test('単一キーワードのハイライト', () => {
    render(
      <HighlightedText text="JavaScript入門" highlight="JavaScript" />
    );
    expect(screen.getByRole('mark')).toHaveTextContent('JavaScript');
  });

  test('複数キーワードのハイライト', () => {
    render(
      <HighlightedText 
        text="JavaScript と React の入門書" 
        highlight="JavaScript React" 
      />
    );
    expect(screen.getAllByRole('mark')).toHaveLength(2);
  });

  test('大文字小文字を無視したハイライト', () => {
    render(
      <HighlightedText text="javascript" highlight="JavaScript" />
    );
    expect(screen.getByRole('mark')).toBeInTheDocument();
  });

  test('ハイライト対象がない場合', () => {
    render(
      <HighlightedText text="Python プログラミング" highlight="JavaScript" />
    );
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  test('空のハイライトキーワード', () => {
    render(
      <HighlightedText text="JavaScript入門" highlight="" />
    );
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
    expect(screen.getByText('JavaScript入門')).toBeInTheDocument();
  });

  test('部分マッチのハイライト', () => {
    render(
      <HighlightedText text="JavaScript入門書" highlight="Script" />
    );
    expect(screen.getByRole('mark')).toHaveTextContent('Script');
  });

  test('日本語のハイライト', () => {
    render(
      <HighlightedText text="プログラミング入門" highlight="プログラミング" />
    );
    expect(screen.getByRole('mark')).toHaveTextContent('プログラミング');
  });
});