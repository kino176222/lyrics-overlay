import { Composition } from 'remotion';
import { LyricsEditor, LyricsLine } from './components/LyricsEditor';
import { WaveformTimeline } from './components/WaveformTimeline';
import { UnifiedStudio } from './components/UnifiedStudio';
import { SimpleLyrics } from './compositions/SimpleLyrics';
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
  // localStorageから読み込み、なければ初期値を使用
  const [lyrics, setLyrics] = useState<LyricsLine[]>(() => {
    const saved = localStorage.getItem('lyricsData');
    return saved ? JSON.parse(saved) : initialLyrics;
  });
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(() => {
    const saved = localStorage.getItem('styleSettings');
    return saved ? JSON.parse(saved) : initialStyleSettings;
  });

  // 変更時にlocalStorageに保存
  React.useEffect(() => {
    localStorage.setItem('lyricsData', JSON.stringify(lyrics));
  }, [lyrics]);
  
  React.useEffect(() => {
    localStorage.setItem('styleSettings', JSON.stringify(styleSettings));
  }, [styleSettings]);

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

// 書き出し用のラッパー（localStorageから直接読み込み）
const ExportVideoWrapper: React.FC<{ format: 'youtube' | 'vertical' }> = ({ format }) => {
  // localStorageから最新のデータを読み込む
  const [lyrics, setLyrics] = useState<LyricsLine[]>(() => {
    const saved = localStorage.getItem('lyricsData');
    return saved ? JSON.parse(saved) : initialLyrics;
  });
  
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(() => {
    const saved = localStorage.getItem('styleSettings');
    return saved ? JSON.parse(saved) : initialStyleSettings;
  });

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
      {/* シンプルな歌詞のみの動画 */}
      <Composition
        id="SimpleLyrics"
        component={SimpleLyrics}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      
      {/* 🎯 統合エディター（編集とプレビューを同時表示） */}
      <Composition
        id="UnifiedStudio"
        component={UnifiedStudio}
        durationInFrames={18000} // 300秒（5分）= 18000フレーム
        fps={60}
        width={1920}
        height={1080}
      />
      
      {/* 波形タイムラインエディター（従来版） */}
      <Composition
        id="WaveformEditor"
        component={WaveformTimelineWrapper}
        durationInFrames={18000} // 300秒（5分）= 18000フレーム
        fps={60}
        width={1400}
        height={800}
      />

      {/* YouTube横動画用 - 最終書き出し用 */}
      <Composition
        id="LyricsVideoYouTube"
        component={() => <ExportVideoWrapper format="youtube" />}
        durationInFrames={18000} // 編集画面と同じ長さ
        fps={60}
        width={1920}
        height={1080}
      />

      {/* TikTok/Instagram縦動画用 - 最終書き出し用 */}
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