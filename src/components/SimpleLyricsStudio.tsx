import React from 'react';

export interface SimpleLyricsStudioProps {
  onLyricsGenerated?: () => void;
}

export const SimpleLyricsStudio: React.FC<SimpleLyricsStudioProps> = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px',
      }}
    >
      <h1 style={{ 
        fontSize: '32px', 
        color: '#1f2937', 
        marginBottom: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        🎵 歌詞動画スタジオ
      </h1>
      
      <p style={{ 
        fontSize: '18px', 
        color: '#6b7280', 
        textAlign: 'center',
        marginBottom: '32px',
        lineHeight: 1.6
      }}>
        MP3 + 歌詞テキスト → 3分で完璧な歌詞動画
      </p>

      <div style={{
        border: '2px dashed #d1d5db',
        borderRadius: '12px',
        padding: '48px 32px',
        textAlign: 'center',
        backgroundColor: 'white',
        maxWidth: '500px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
          ファイルをドラッグ&ドロップ
        </h3>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          MP3音声 + 歌詞TXT + 背景画像（オプション）
        </p>
      </div>

      <div style={{
        marginTop: '32px',
        fontSize: '12px',
        color: '#9ca3af',
      }}>
        Remotion Studio で正常に動作中 ✅
      </div>
    </div>
  );
};