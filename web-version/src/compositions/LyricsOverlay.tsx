import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import lyricsJson from '../lyrics-data.json';

// JSONファイルから歌詞データを読み込んで、フレーム数に変換
const lyricsData = lyricsJson.map(item => ({
  startFrame: item.startTime * 30, // 秒数 × 30fps = フレーム数
  endFrame: item.endTime * 30,
  text: item.text
}));

export const LyricsOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 現在表示すべき歌詞を探す
  const currentLyric = lyricsData.find(
    lyric => frame >= lyric.startFrame && frame < lyric.endFrame
  );

  if (!currentLyric) {
    return null;
  }

  // フェードイン効果（最初の10フレームで透明度を0から1に）
  const fadeInProgress = interpolate(
    frame - currentLyric.startFrame,
    [0, 10],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // フェードアウト効果（最後の15フレームで透明度を1から0に）
  const fadeOutProgress = interpolate(
    frame,
    [currentLyric.endFrame - 15, currentLyric.endFrame],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // 最終的な透明度（フェードインとフェードアウトの小さい方を使用）
  const finalOpacity = Math.min(fadeInProgress, fadeOutProgress);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent', // 透過背景
      }}
    >
      {/* 歌詞テキスト */}
      <div
        style={{
          position: 'absolute',
          bottom: '26px',                         // 半行分さらに下げた位置
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: finalOpacity,
          width: '100%',                          // 幅を100%に
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
              fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',  // 美しい明朝体
              fontSize: '52px',                    // 指定のサイズ
              color: 'black',                      // 黒い文字
              textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.8), 0 0 5px rgba(255,255,255,0.7), 0.5px 0.5px 0 rgba(255,255,255,0.9)',  // ぼんやり発光するグロー効果
              textAlign: 'center',
              margin: 0,
              fontWeight: 'bold',                  // 太字でしっかり表示
            }}
          >
            {currentLyric.text}
          </h1>
        </div>
      </div>
    </AbsoluteFill>
  );
};