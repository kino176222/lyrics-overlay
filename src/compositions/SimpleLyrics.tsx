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

  // Y軸オフセットを適用
  const getTransform = () => {
    const yOffset = lyricsData.style.yOffset || 0;
    return `translateY(${yOffset}px)`;
  };

  return (
    <AbsoluteFill style={{
      backgroundColor: 'transparent',
      justifyContent: getJustifyContent(),
      alignItems: 'center',
      padding: getPadding()
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