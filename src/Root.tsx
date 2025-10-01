import { Composition } from 'remotion';
import { LyricsEditor, LyricsLine } from './components/LyricsEditor';
import { WaveformTimeline } from './components/WaveformTimeline';
import { UnifiedStudio } from './components/UnifiedStudio';
import { LyricsMatch } from './compositions/LyricsMatch';
import { StyleSettings } from './components/StyleControls';
import { generateSampleLyrics } from './utils/aiTiming';
import React, { useState, useEffect } from 'react';
import lyricsData from './lyrics-data.json';

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
  // JSONファイルの内容をwindowオブジェクトに設定（Studio用）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).lyricsData = lyricsData;
    }
  }, []);

  return (
    <LyricsProvider>
      {/* 歌詞表示 - プレビューと完全一致 */}
      <Composition
        id="LyricsMatch"
        component={LyricsMatch}
        durationInFrames={7410}
        fps={30}
        width={1920}
        height={1080}
        backgroundColor="transparent"
      />
    </LyricsProvider>
  );
};