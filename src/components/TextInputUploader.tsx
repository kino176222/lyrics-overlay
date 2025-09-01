import React, { useState } from 'react';

export interface TextInputUploaderProps {
  onTextSubmit: (text: string) => void;
  style?: React.CSSProperties;
}

export const TextInputUploader: React.FC<TextInputUploaderProps> = ({ 
  onTextSubmit, 
  style = {} 
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = () => {
    if (inputText.trim().length === 0) {
      alert('歌詞テキストを入力してください');
      return;
    }

    setIsProcessing(true);
    onTextSubmit(inputText.trim());
    
    // 処理完了後にリセット
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  const handleClear = () => {
    setInputText('');
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    ...style,
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    height: '150px',
    padding: '16px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    backgroundColor: '#fafafa',
    minHeight: '120px',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginRight: '12px',
    transition: 'all 0.2s ease',
    minWidth: '140px',
  };

  const clearButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6b7280',
  };

  return (
    <div style={containerStyle}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '18px', 
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📝 歌詞テキスト入力
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="歌詞をここにコピー&ペーストしてください...

例：
君の笑顔が好きなんだ
この瞬間を忘れないで
時が過ぎても変わらずに"
          style={textareaStyle}
          disabled={isProcessing}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {inputText.length > 0 && (
            <>
              文字数: {inputText.length} | 
              行数: {inputText.split('\n').filter(line => line.trim()).length}
            </>
          )}
        </div>
        
        <div>
          <button
            style={clearButtonStyle}
            onClick={handleClear}
            disabled={isProcessing || inputText.length === 0}
            onMouseOver={(e) => {
              if (!isProcessing && inputText.length > 0) {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }
            }}
          >
            クリア
          </button>
          
          <button
            style={{
              ...buttonStyle,
              backgroundColor: isProcessing ? '#9ca3af' : '#4f46e5',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSubmit}
            disabled={isProcessing || inputText.length === 0}
            onMouseOver={(e) => {
              if (!isProcessing && inputText.length > 0) {
                e.currentTarget.style.backgroundColor = '#4338ca';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing && inputText.length > 0) {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }
            }}
          >
            {isProcessing ? '処理中...' : 'AI認識開始'}
          </button>
        </div>
      </div>

      {inputText.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f0f9f0',
          borderRadius: '6px',
          border: '1px solid #d1fae5',
        }}>
          <div style={{ fontSize: '12px', color: '#059669' }}>
            ✅ テキスト入力完了 - AI認識ボタンを押してください
          </div>
        </div>
      )}
    </div>
  );
};