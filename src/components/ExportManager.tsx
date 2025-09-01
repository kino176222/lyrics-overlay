import React, { useState } from 'react';
import { LyricsLine } from './LyricsEditor';

export interface ExportFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  platform: string;
  position: 'bottom' | 'center' | 'top';
  fontSize: number;
}

export interface ExportManagerProps {
  lyricsData: LyricsLine[];
  audioFile?: string;
  backgroundImage?: string;
  onExport: (formats: ExportFormat[]) => void;
  style?: React.CSSProperties;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  lyricsData,
  audioFile,
  backgroundImage,
  onExport,
  style = {},
}) => {
  // 利用可能な出力フォーマット
  const availableFormats: ExportFormat[] = [
    {
      id: 'youtube',
      name: 'YouTube (横動画)',
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      platform: 'YouTube',
      position: 'bottom',
      fontSize: 48,
    },
    {
      id: 'youtube-shorts',
      name: 'YouTube Shorts (縦動画)',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      platform: 'YouTube Shorts',
      position: 'center',
      fontSize: 54,
    },
    {
      id: 'tiktok',
      name: 'TikTok (縦動画)',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      platform: 'TikTok',
      position: 'center',
      fontSize: 54,
    },
    {
      id: 'instagram-feed',
      name: 'Instagram フィード (正方形)',
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      platform: 'Instagram',
      position: 'center',
      fontSize: 48,
    },
    {
      id: 'instagram-story',
      name: 'Instagram ストーリー (縦動画)',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      platform: 'Instagram',
      position: 'center',
      fontSize: 54,
    },
    {
      id: 'twitter',
      name: 'Twitter (横動画)',
      width: 1280,
      height: 720,
      aspectRatio: '16:9',
      platform: 'Twitter',
      position: 'bottom',
      fontSize: 42,
    },
  ];

  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    new Set(['youtube', 'youtube-shorts', 'tiktok'])
  );
  const [isExporting, setIsExporting] = useState(false);

  // フォーマット選択の切り替え
  const toggleFormat = (formatId: string) => {
    const newSelected = new Set(selectedFormats);
    if (newSelected.has(formatId)) {
      newSelected.delete(formatId);
    } else {
      newSelected.add(formatId);
    }
    setSelectedFormats(newSelected);
  };

  // 全選択/全解除
  const selectAll = () => {
    setSelectedFormats(new Set(availableFormats.map(f => f.id)));
  };

  const selectNone = () => {
    setSelectedFormats(new Set());
  };

  // エクスポート実行
  const handleExport = () => {
    const formatsToExport = availableFormats.filter(f => 
      selectedFormats.has(f.id)
    );
    
    if (formatsToExport.length === 0) {
      alert('出力フォーマットを選択してください');
      return;
    }

    if (!lyricsData || lyricsData.length === 0) {
      alert('歌詞データがありません');
      return;
    }

    setIsExporting(true);
    onExport(formatsToExport);
    
    // 実際のエクスポート処理完了後にsetIsExporting(false)を呼ぶ
    // ここでは3秒後にリセット（デモ用）
    setTimeout(() => setIsExporting(false), 3000);
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    ...style,
  };

  const formatCardStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#f9fafb',
  };

  const selectedCardStyle: React.CSSProperties = {
    ...formatCardStyle,
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
    boxShadow: '0 0 0 1px #4f46e5',
  };

  const exportButtonStyle: React.CSSProperties = {
    backgroundColor: isExporting ? '#9ca3af' : '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: isExporting ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    marginTop: '16px',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ 
        margin: '0 0 24px 0', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        color: '#1f2937' 
      }}>
        📤 一括出力設定
      </h2>

      {/* 統計情報 */}
      <div style={{
        backgroundColor: '#f0f9f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid #d1fae5',
      }}>
        <div style={{ fontSize: '14px', color: '#059669', marginBottom: '8px' }}>
          <strong>準備完了 ✅</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#374151' }}>
          歌詞行数: {lyricsData.length}行 | 
          音声: {audioFile ? '✅' : '❌'} | 
          背景画像: {backgroundImage ? '✅' : '❌'}
        </div>
      </div>

      {/* 選択ボタン */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={selectAll}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '8px',
          }}
        >
          全選択
        </button>
        <button
          onClick={selectNone}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          全解除
        </button>
      </div>

      {/* フォーマット選択 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          color: '#374151' 
        }}>
          出力フォーマットを選択:
        </h3>

        {availableFormats.map((format) => {
          const isSelected = selectedFormats.has(format.id);
          
          return (
            <div
              key={format.id}
              style={isSelected ? selectedCardStyle : formatCardStyle}
              onClick={() => toggleFormat(format.id)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '500',
                      color: isSelected ? '#4f46e5' : '#374151',
                    }}>
                      {format.name}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '16px' }}>✅</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {format.width}×{format.height} ({format.aspectRatio}) | 
                    {format.platform} | 
                    フォント: {format.fontSize}px | 
                    位置: {format.position}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 出力情報 */}
      {selectedFormats.size > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #fed7aa',
        }}>
          <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
            <strong>出力予定: {selectedFormats.size}個のフォーマット</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#78350f' }}>
            ⚠️ ProRes 4444形式で透明背景動画を出力します。
            Final Cut Proで直接利用できます。
          </div>
        </div>
      )}

      {/* エクスポートボタン */}
      <button
        style={exportButtonStyle}
        onClick={handleExport}
        disabled={isExporting || selectedFormats.size === 0}
        onMouseOver={(e) => {
          if (!isExporting && selectedFormats.size > 0) {
            e.currentTarget.style.backgroundColor = '#047857';
          }
        }}
        onMouseOut={(e) => {
          if (!isExporting && selectedFormats.size > 0) {
            e.currentTarget.style.backgroundColor = '#059669';
          }
        }}
      >
        {isExporting ? (
          <>
            <span>🔄 出力中... ({selectedFormats.size}個のファイル)</span>
          </>
        ) : (
          `🚀 ${selectedFormats.size}個のフォーマットで一括出力`
        )}
      </button>

      {/* 出力先の説明 */}
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '12px',
        textAlign: 'center',
      }}>
        出力ファイルは Remotion の public/out/ フォルダに保存されます
      </div>
    </div>
  );
};