import { Composition } from 'remotion';
import { LyricsEditor, LyricsLine } from './components/LyricsEditor';
import { WaveformTimeline } from './components/WaveformTimeline';
import { StyleSettings } from './components/StyleControls';
import { generateSampleLyrics } from './utils/aiTiming';
import React, { useState } from 'react';

// 歌詞とスタイルの初期状態
const initialLyrics: LyricsLine[] = [
  { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
  { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
  { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
  { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
];

const initialStyleSettings: StyleSettings = {
  fontFamily: "'Shippori Mincho', 'しっぽり明朝', serif",
  fontSize: 24,
  fontWeight: 'bold',
  fontColor: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 1,
  position: 'bottom',
  yOffset: 0,
  animationStyle: 'fade',
  fadeSpeed: 0.5,
};

// Wrapper component to handle state
const WaveformTimelineWrapper: React.FC = () => {
  const [lyrics, setLyrics] = useState<LyricsLine[]>(initialLyrics);
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(initialStyleSettings);

  return (
    <WaveformTimeline
      lyrics={lyrics}
      audioFile={undefined}
      styleSettings={styleSettings}
      onLyricsChange={setLyrics}
      onStyleChange={setStyleSettings}
    />
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 波形タイムラインエディター（メインエディター） */}
      <Composition
        id="WaveformEditor"
        component={WaveformTimelineWrapper}
        durationInFrames={18000} // 300秒（5分）= 18000フレーム
        fps={60}
        width={1400}
        height={800}
      />

      {/* YouTube横動画用 */}
      <Composition
        id="LyricsVideoYouTube"
        component={LyricsEditor}
        durationInFrames={6000} // 100秒 (60fps)
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          format: 'youtube' as const,
          lyricsData: [
            { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
            { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
            { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
            { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
          ],
          fontFamily: "'Shippori Mincho', 'しっぽり明朝', serif",
          fontSize: 48,
          fontColor: '#000000',
          strokeColor: '#FFFFFF',
          strokeWidth: 2,
          position: 'bottom' as const,
        }}
      />

      {/* TikTok/Instagram縦動画用 */}
      <Composition
        id="LyricsVideoVertical"
        component={LyricsEditor}
        durationInFrames={6000}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          format: 'vertical' as const,
          lyricsData: [
            { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
            { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
            { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
            { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
          ],
          fontFamily: "'Shippori Mincho', 'しっぽり明朝', serif",
          fontSize: 54,
          fontColor: '#000000',
          strokeColor: '#FFFFFF', 
          strokeWidth: 2,
          position: 'center' as const,
        }}
      />
    </>
  );
};