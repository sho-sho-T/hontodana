/**
 * テキストハイライトコンポーネント
 * TODO: 実装予定（TDD Red Phase）
 */

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export function HighlightedText({ text, highlight, className }: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  // 複数のキーワードを分割
  const keywords = highlight.trim().split(/\s+/);
  
  // 正規表現パターンを作成（大文字小文字を無視、部分マッチ）
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  
  // テキストを分割してハイライト部分を特定
  const parts = text.split(pattern);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // パターンにマッチする部分かチェック
        const isHighlight = keywords.some(keyword => 
          part.toLowerCase() === keyword.toLowerCase()
        );
        
        return isHighlight ? (
          <mark key={index} role="mark">{part}</mark>
        ) : (
          part
        );
      })}
    </span>
  );
}