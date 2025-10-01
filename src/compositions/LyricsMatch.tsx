import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import lyricsData from '../lyrics-data.json';

// Remotion Studio対応: window.lyricsDataが存在する場合はそれを使用
const getLyricsData = () => {
  if (typeof window !== 'undefined' && (window as any).lyricsData) {
    return (window as any).lyricsData;
  }
  return lyricsData;
};

export const LyricsMatch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // 動的にデータを取得
  const currentLyricsData = getLyricsData();

  // 現在表示すべき歌詞を探す
  const currentLyric = currentLyricsData.lyrics.find(
    lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
  );

  if (!currentLyric) {
    return null;
  }

  // フェードイン/アウト
  const progress = (currentTime - currentLyric.startTime) / (currentLyric.endTime - currentLyric.startTime);
  const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // スタイル設定をJSONから読み込み
  const { style } = currentLyricsData;
  
  // timing-editor.htmlと完全に同じ実装
  const getAlignItems = (position: string) => {
    switch(position) {
      case 'top': return 'flex-start';
      case 'center': return 'center';
      case 'bottom': return 'flex-end';
      default: return 'flex-end';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: getAlignItems(style.position),
      justifyContent: 'center',
      paddingBottom: style.position === 'bottom' ? '50px' : '0',
      pointerEvents: 'none'
    }}>
      <div style={{
        fontSize: `${style.fontSize}px`,
        color: style.fontColor,
        textShadow: `0 0 ${style.strokeWidth}px ${style.strokeColor}`,
        fontFamily: style.fontFamily,
        transform: `translateY(${style.yOffset}px)`,
        opacity,
        lineHeight: 1.5,
        textAlign: 'center'
      }}>
        {currentLyric.text}
      </div>
    </div>
  );
};