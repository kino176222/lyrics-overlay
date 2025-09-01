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

// 共有状態を管理するコンテキスト
const LyricsContext = React.createContext<{
  lyrics: LyricsLine[];
  styleSettings: StyleSettings;
  setLyrics: (lyrics: LyricsLine[]) => void;
  setStyleSettings: (settings: StyleSettings) => void;
} | null>(null);

const LyricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lyrics, setLyrics] = useState<LyricsLine[]>(initialLyrics);
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(initialStyleSettings);

  return (
    <LyricsContext.Provider value={{ lyrics, styleSettings, setLyrics, setStyleSettings }}>
      {children}
    </LyricsContext.Provider>
  );
};

// 編集画面用のラッパー
const WaveformTimelineWrapper: React.FC = () => {
  const context = React.useContext(LyricsContext);
  if (!context) return null;

  const { lyrics, styleSettings, setLyrics, setStyleSettings } = context;

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

// 書き出し用のラッパー
const ExportVideoWrapper: React.FC<{ format: 'youtube' | 'vertical' }> = ({ format }) => {
  const context = React.useContext(LyricsContext);
  if (!context) return null;

  const { lyrics, styleSettings } = context;

  return (
    <LyricsEditor
      format={format}
      lyricsData={lyrics}
      fontFamily={styleSettings.fontFamily}
      fontSize={format === 'youtube' ? Math.max(styleSettings.fontSize, 48) : Math.max(styleSettings.fontSize, 54)}
      fontColor={styleSettings.fontColor}
      strokeColor={styleSettings.strokeColor}
      strokeWidth={styleSettings.strokeWidth}
      position={styleSettings.position}
    />
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <LyricsProvider>
      {/* 波形タイムラインエディター（メインエディター） */}
      <Composition
        id="WaveformEditor"
        component={WaveformTimelineWrapper}
        durationInFrames={18000} // 300秒（5分）= 18000フレーム
        fps={60}
        width={1400}
        height={800}
      />

      {/* YouTube横動画用 - 編集内容を自動反映 */}
      <Composition
        id="LyricsVideoYouTube"
        component={() => <ExportVideoWrapper format="youtube" />}
        durationInFrames={18000} // 編集画面と同じ長さ
        fps={60}
        width={1920}
        height={1080}
      />

      {/* TikTok/Instagram縦動画用 - 編集内容を自動反映 */}
      <Composition
        id="LyricsVideoVertical"
        component={() => <ExportVideoWrapper format="vertical" />}
        durationInFrames={18000} // 編集画面と同じ長さ
        fps={60}
        width={1080}
        height={1920}
      />
    </LyricsProvider>
  );
};