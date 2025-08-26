import React from 'react';
import { AbsoluteFill, Audio, interpolate, useCurrentFrame, spring, useVideoConfig, staticFile } from 'remotion';
import lyricsJson from '../lyrics-data.json';

// JSONファイルから歌詞データを読み込んで、フレーム数に変換
const lyricsData = lyricsJson.map(item => ({
  startFrame: item.startTime * 30, // 秒数 × 30fps = フレーム数
  endFrame: item.endTime * 30,
  text: item.text
}));

export const LyricsWithAudio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 現在表示すべき歌詞を探す
  const currentLyric = lyricsData.find(
    lyric => frame >= lyric.startFrame && frame < lyric.endFrame
  );

  if (!currentLyric) {
    return (
      <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
        {/* 音声ファイルを含める（publicフォルダに配置） */}
        <Audio src={staticFile('audio.mp3')} />
      </AbsoluteFill>
    );
  }

  // アニメーション計算
  const animationProgress = spring({
    fps,
    frame: frame - currentLyric.startFrame,
    config: {
      damping: 30,
      stiffness: 150,
      mass: 1,
    },
  });

  // フェードアウト効果
  const fadeOutProgress = interpolate(
    frame,
    [currentLyric.endFrame - 15, currentLyric.endFrame],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // スケールアニメーション
  const scale = interpolate(animationProgress, [0, 1], [0.8, 1]);

  // Y位置のアニメーション（下から上にスライドイン）
  const translateY = interpolate(animationProgress, [0, 1], [50, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent', // 透過背景
      }}
    >
      {/* 音声ファイルを含める */}
      <Audio src={staticFile('audio.mp3')} />
      
      {/* 歌詞テキスト */}
      <div
        style={{
          position: 'absolute',
          bottom: '150px',
          left: '50%',
          transform: `translateX(-50%) translateY(${translateY}px) scale(${scale})`,
          opacity: fadeOutProgress,
          width: '80%',
          textAlign: 'center',
        }}
      >
        {/* 背景（半透明の黒） */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '20px 40px',
            borderRadius: '15px',
            display: 'inline-block',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* テキスト本体 */}
          <h1
            style={{
              color: 'white',
              fontSize: '60px',
              fontWeight: 'bold',
              margin: 0,
              textShadow: '2px 2px 10px rgba(0, 0, 0, 0.8)',
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}
          >
            {currentLyric.text}
          </h1>
        </div>
      </div>
    </AbsoluteFill>
  );
};