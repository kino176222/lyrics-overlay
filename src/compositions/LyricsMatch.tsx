import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import lyricsData from '../lyrics-data.json';

export const LyricsMatch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // 現在表示すべき歌詞を探す
  const currentLyric = lyricsData.lyrics.find(
    lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
  );

  if (!currentLyric) {
    return <AbsoluteFill style={{ backgroundColor: 'transparent' }} />;
  }

  // フェードイン/アウト
  const progress = (currentTime - currentLyric.startTime) / (currentLyric.endTime - currentLyric.startTime);
  const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // スタイル設定をJSONから読み込み
  const { style } = lyricsData;
  
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
    <AbsoluteFill>
      <div style={{ 
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: getAlignItems(style.position),
        justifyContent: 'center',
        paddingBottom: style.position === 'bottom' ? '50px' : '0',  // 下部の場合は余白を追加
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
    </AbsoluteFill>
  );
};