import React, { useState, useEffect, useRef } from 'react';
import { Composition, useCurrentFrame, useVideoConfig } from 'remotion';
import { LyricsEditor, LyricsLine } from './components/LyricsEditor';
import { StyleSettings } from './components/StyleControls';

// シンプルなデータ管理
const DEFAULT_LYRICS: LyricsLine[] = [
  { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
  { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
  { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
  { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
];

// グローバル変数でデータを管理（最もシンプル）
let globalLyrics = DEFAULT_LYRICS;
let globalStyle: StyleSettings = {
  fontFamily: "'Shippori Mincho', serif",
  fontSize: 48,
  fontWeight: 'bold',
  fontColor: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 2,
  position: 'bottom',
  yOffset: 0,
  animationStyle: 'fade',
  fadeSpeed: 0.5,
};

// エディターコンポーネント（編集機能付き）
export const SimpleEditor: React.FC = () => {
  const [lyrics, setLyrics] = useState(globalLyrics);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 歌詞を更新
  const updateLyrics = (index: number, text: string) => {
    const newLyrics = [...lyrics];
    newLyrics[index].text = text;
    setLyrics(newLyrics);
    globalLyrics = newLyrics;
  };

  // タイミングを調整
  const adjustTiming = (index: number, type: 'start' | 'end', delta: number) => {
    const newLyrics = [...lyrics];
    if (type === 'start') {
      newLyrics[index].startTime = Math.max(0, newLyrics[index].startTime + delta);
    } else {
      newLyrics[index].endTime = Math.max(newLyrics[index].startTime + 0.5, newLyrics[index].endTime + delta);
    }
    setLyrics(newLyrics);
    globalLyrics = newLyrics;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a' }}>
      {/* 左側：編集パネル */}
      <div style={{ 
        width: '400px', 
        padding: '20px',
        borderRight: '1px solid #444',
        overflowY: 'auto'
      }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>歌詞編集</h2>
        
        {lyrics.map((line, index) => (
          <div key={index} style={{
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: selectedIndex === index ? '#333' : '#222',
            borderRadius: '5px',
            cursor: 'pointer'
          }} onClick={() => setSelectedIndex(index)}>
            <input
              type="text"
              value={line.text}
              onChange={(e) => updateLyrics(index, e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                marginBottom: '5px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
              <span style={{ color: '#888' }}>
                {line.startTime.toFixed(1)}s - {line.endTime.toFixed(1)}s
              </span>
              <button onClick={() => adjustTiming(index, 'start', -0.1)}>◀</button>
              <button onClick={() => adjustTiming(index, 'start', 0.1)}>▶</button>
              <button onClick={() => adjustTiming(index, 'end', -0.1)}>◀</button>
              <button onClick={() => adjustTiming(index, 'end', 0.1)}>▶</button>
            </div>
          </div>
        ))}
        
        {/* 新規追加ボタン */}
        <button 
          onClick={() => {
            const lastLine = lyrics[lyrics.length - 1];
            const newLine = {
              text: "新しい歌詞",
              startTime: lastLine ? lastLine.endTime : 0,
              endTime: lastLine ? lastLine.endTime + 3 : 3,
              confidence: 1.0
            };
            const newLyrics = [...lyrics, newLine];
            setLyrics(newLyrics);
            globalLyrics = newLyrics;
          }}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          + 歌詞を追加
        </button>
      </div>

      {/* 右側：プレビュー */}
      <div style={{ flex: 1, position: 'relative' }}>
        <LyricsEditor
          format="youtube"
          lyricsData={lyrics}
          fontFamily={globalStyle.fontFamily}
          fontSize={globalStyle.fontSize}
          fontColor={globalStyle.fontColor}
          strokeColor={globalStyle.strokeColor}
          strokeWidth={globalStyle.strokeWidth}
          position={globalStyle.position}
        />
      </div>
    </div>
  );
};

// 動画出力用コンポーネント（グローバル変数から読み込み）
export const VideoOutput: React.FC<{ format: 'youtube' | 'vertical' }> = ({ format }) => {
  return (
    <LyricsEditor
      format={format}
      lyricsData={globalLyrics}
      fontFamily={globalStyle.fontFamily}
      fontSize={format === 'youtube' ? globalStyle.fontSize : globalStyle.fontSize + 6}
      fontColor={globalStyle.fontColor}
      strokeColor={globalStyle.strokeColor}
      strokeWidth={globalStyle.strokeWidth}
      position={globalStyle.position}
    />
  );
};