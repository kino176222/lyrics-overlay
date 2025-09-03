import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import lyricsData from '../lyrics-data.json';

export const SimpleLyricsFixed: React.FC = () => {
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

  // フォントファミリーをクリーンアップ（余分なクォートを削除）
  const cleanFontFamily = (fontFamily: string) => {
    // 外側のクォートを削除
    return fontFamily.replace(/^['"](.*)['"]$/, '$1');
  };

  // 位置計算（timing-editor.htmlと完全に同じロジック）
  const getPositionStyles = () => {
    const yOffset = lyricsData.style.yOffset || 0;
    
    if (lyricsData.style.position === 'bottom') {
      return {
        position: 'absolute' as const,
        bottom: 100,  // 下から100px（固定値）
        left: 0,
        right: 0,
        transform: `translateY(${yOffset}px)`
      };
    } else if (lyricsData.style.position === 'top') {
      return {
        position: 'absolute' as const,
        top: 100,  // 上から100px
        left: 0,
        right: 0,
        transform: `translateY(${yOffset}px)`
      };
    } else {
      // center
      return {
        position: 'absolute' as const,
        top: '50%',
        left: 0,
        right: 0,
        transform: `translateY(-50%) translateY(${yOffset}px)`
      };
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <div style={{
        ...getPositionStyles(),
        textAlign: 'center',
        padding: '0 50px'
      }}>
        <span style={{
          fontSize: lyricsData.style.fontSize,
          color: lyricsData.style.fontColor,
          fontFamily: cleanFontFamily(lyricsData.style.fontFamily),
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