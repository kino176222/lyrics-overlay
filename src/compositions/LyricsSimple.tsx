import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import lyricsData from '../lyrics-data.json';

export const LyricsSimple: React.FC = () => {
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

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* 画面下部に固定配置 */}
      <div style={{
        position: 'absolute',
        bottom: Math.abs(lyricsData.style.yOffset || 0) + 100,  // yOffsetを考慮
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 50px'
      }}>
        <span style={{
          fontSize: lyricsData.style.fontSize,
          color: lyricsData.style.fontColor,
          fontFamily: lyricsData.style.fontFamily.replace(/['"]/g, ''),  // クォートを削除
          fontWeight: 'bold',
          textShadow: `0 0 ${lyricsData.style.strokeWidth}px ${lyricsData.style.strokeColor}`,
          opacity,
          lineHeight: 1.5
        }}>
          {currentLyric.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};