import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, getRemotionEnvironment } from 'remotion';
import lyricsData from '../lyrics-data.json';

export const SimpleLyrics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const isRendering = getRemotionEnvironment().isRendering;

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

  // 位置設定（timing-editor.htmlと同じロジックに統一）
  const getAlignItems = () => {
    switch(lyricsData.style.position) {
      case 'top': return 'flex-start';
      case 'center': return 'center';  
      case 'bottom': 
      default: return 'flex-end';
    }
  };

  // Y軸オフセットを適用（相対位置対応）
  const getTransform = () => {
    let yOffset = lyricsData.style.yOffset || 0;
    
    // yOffsetが-200より小さい場合は、画面下部からの相対位置として扱う
    // bottom位置で-430なら、下から70px程度の位置を意図していると推測
    if (lyricsData.style.position === 'bottom' && yOffset < -200) {
      // 極端な値を適切な範囲に調整
      yOffset = Math.max(yOffset + 350, -100);
    }
    
    return `translateY(${yOffset}px)`;
  };

  return (
    <AbsoluteFill style={{
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: getAlignItems(),
      justifyContent: 'center',
      padding: lyricsData.style.position === 'bottom' ? '0 20px 80px 20px' : '20px'
    }}>
      {/* 歌詞テキストのみ - ガイドなし */}
      <div style={{
        fontSize: lyricsData.style.fontSize,
        color: lyricsData.style.fontColor,
        fontFamily: lyricsData.style.fontFamily || 'Hiragino Sans, Yu Gothic, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: `0 0 ${lyricsData.style.strokeWidth}px ${lyricsData.style.strokeColor}`,
        opacity,
        padding: '0 50px',
        transform: getTransform(),
        transition: 'transform 0.3s ease'
      }}>
        {currentLyric.text}
      </div>
    </AbsoluteFill>
  );
};