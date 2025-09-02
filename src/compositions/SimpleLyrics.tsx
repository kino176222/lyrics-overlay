import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import lyricsData from '../lyrics-data.json';

export const SimpleLyrics: React.FC = () => {
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

  // フェードイン/アウトの計算
  const progress = (currentTime - currentLyric.startTime) / (currentLyric.endTime - currentLyric.startTime);
  const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // 位置設定
  const getJustifyContent = () => {
    switch(lyricsData.style.position) {
      case 'top': return 'flex-start';
      case 'center': return 'center';  
      case 'bottom': 
      default: return 'flex-end';
    }
  };

  const getPadding = () => {
    switch(lyricsData.style.position) {
      case 'top': return '100px 0 0 0';
      case 'center': return '0';  
      case 'bottom': 
      default: return '0 0 100px 0';
    }
  };

  return (
    <AbsoluteFill style={{
      backgroundColor: 'transparent',
      justifyContent: getJustifyContent(),
      alignItems: 'center',
      padding: getPadding()
    }}>
      {/* プレビュー用のガイドライン */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        border: '2px dashed rgba(255,255,255,0.3)',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.1) 100%)'
      }}>
        {/* セーフエリアガイド */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          right: '5%',
          bottom: '10%',
          border: '1px dashed rgba(255,255,255,0.2)'
        }} />
        
        {/* 中央線 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'rgba(255,255,255,0.3)'
        }} />
        
        {/* 位置表示 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          位置: {lyricsData.style.position} | サイズ: {lyricsData.style.fontSize}px
        </div>
      </div>

      {/* 歌詞テキスト */}
      <div style={{
        fontSize: lyricsData.style.fontSize,
        color: lyricsData.style.fontColor,
        fontFamily: lyricsData.style.fontFamily || 'Hiragino Sans, Yu Gothic, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: `0 0 ${lyricsData.style.strokeWidth}px ${lyricsData.style.strokeColor}`,
        opacity,
        padding: '0 50px',
        zIndex: 10,
        position: 'relative'
      }}>
        {currentLyric.text}
      </div>
    </AbsoluteFill>
  );
};