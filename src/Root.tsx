import { Composition } from 'remotion';
import { LyricsEditor, LyricsLine } from './components/LyricsEditor';
import { WaveformTimeline } from './components/WaveformTimeline';
import { UnifiedStudio } from './components/UnifiedStudio';
import { LyricsMatch } from './compositions/LyricsMatch';
import { StyleSettings } from './components/StyleControls';
import { generateSampleLyrics } from './utils/aiTiming';
import React, { useEffect, useMemo, useState } from 'react';
import lyricsData from './lyrics-data.json';

type ImportedLyricsData = {
  lyrics?: Array<Partial<LyricsLine> & { text: string; startTime: number; endTime: number }>;
  style?: Partial<StyleSettings>;
};

const fallbackLyrics: LyricsLine[] = [
  { text: '君の笑顔が好きなんだ', startTime: 0, endTime: 3, confidence: 1.0 },
  { text: 'この瞬間を忘れないで', startTime: 3, endTime: 6, confidence: 1.0 },
  { text: '時が過ぎても変わらずに', startTime: 6, endTime: 9, confidence: 1.0 },
  { text: '心の中で歌い続ける', startTime: 9, endTime: 12, confidence: 1.0 },
];

const fallbackStyleSettings: StyleSettings = {
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

const parsedLyricsData = lyricsData as ImportedLyricsData;

const lyricsFromFile: LyricsLine[] = parsedLyricsData?.lyrics?.length
  ? (parsedLyricsData.lyrics.map((line) => ({
    ...line,
    confidence: line.confidence ?? 1.0,
  })) as LyricsLine[])
  : fallbackLyrics;

const styleFromFile: StyleSettings = {
  ...fallbackStyleSettings,
  ...(parsedLyricsData?.style ?? {}),
};

const fileSignature = JSON.stringify({
  lyrics: lyricsFromFile,
  style: styleFromFile,
});

const getStoredObject = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn('⚠️  Failed to parse localStorage value', { key, error });
    return null;
  }
};

const seedFromFileIfNeeded = () => {
  if (typeof window === 'undefined') {
    return { lyrics: lyricsFromFile, style: styleFromFile };
  }

  const storedFileSignature = window.localStorage.getItem('lyricsDataFileSignature');
  if (storedFileSignature !== fileSignature) {
    window.localStorage.setItem('lyricsData', JSON.stringify(lyricsFromFile));
    window.localStorage.setItem('styleSettings', JSON.stringify(styleFromFile));
    window.localStorage.setItem('lyricsDataFileSignature', fileSignature);
    return { lyrics: lyricsFromFile, style: styleFromFile };
  }

  return {
    lyrics: getStoredObject<LyricsLine[]>('lyricsData') ?? lyricsFromFile,
    style: getStoredObject<StyleSettings>('styleSettings') ?? styleFromFile,
  };
};

const getCompositionDurationInFrames = () => {
  const sourceLyrics = getStoredObject<LyricsLine[]>('lyricsData') ?? lyricsFromFile;
  const maxEndTime = sourceLyrics.reduce((max, line) => Math.max(max, line.endTime ?? 0), 0);
  const derived = Math.max(Math.ceil(maxEndTime * 30) + 30, 300);
  return Number.isFinite(derived) ? derived : 3320;
};

// 共有状態を管理するコンテキスト
const LyricsContext = React.createContext<{
  lyrics: LyricsLine[];
  styleSettings: StyleSettings;
  audioFile: string | undefined;
  setLyrics: (lyrics: LyricsLine[]) => void;
  setStyleSettings: (settings: StyleSettings) => void;
  setAudioFile: (audioFile: string | undefined) => void;
} | null>(null);

const LyricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lyrics: initialLyrics, style: initialStyle } = useMemo(() => seedFromFileIfNeeded(), []);

  const [lyrics, setLyrics] = useState<LyricsLine[]>(initialLyrics);
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(initialStyleSettings);

  return (
    <LyricsContext.Provider value={{
      lyrics,
      styleSettings,
      audioFile,
      setLyrics,
      setStyleSettings,
      setAudioFile
    }}>
      {children}
    </LyricsContext.Provider>
  );
};

// 編集画面用のラッパー
const WaveformTimelineWrapper: React.FC = () => {
  const context = React.useContext(LyricsContext);
  if (!context) return null;

  const { lyrics, styleSettings, audioFile, setLyrics, setStyleSettings, setAudioFile } = context;

  return (
    <WaveformTimeline
      lyrics={lyrics}
      audioFile={audioFile}
      styleSettings={styleSettings}
      onLyricsChange={setLyrics}
      onStyleChange={setStyleSettings}
      onAudioFileChange={setAudioFile}
    />
  );
};

// 書き出し用のラッパー（localStorageから直接読み込み）
const ExportVideoWrapper: React.FC<{ format: 'youtube' | 'vertical' }> = ({ format }) => {
  const context = React.useContext(LyricsContext);
  if (!context) return null;

  const { lyrics, styleSettings } = context;

  return (
    <LyricsEditor
      format={format}
      lyricsData={lyrics}
      audioFile={audioFile}
      fontFamily={styleSettings.fontFamily}
      fontSize={format === 'youtube' ? Math.max(styleSettings.fontSize, 48) : Math.max(styleSettings.fontSize, 54)}
      fontColor={styleSettings.fontColor}
      strokeColor={styleSettings.strokeColor}
      strokeWidth={styleSettings.strokeWidth}
      position={styleSettings.position}
      yOffset={styleSettings.yOffset}
      animationStyle={styleSettings.animationStyle}
      fadeSpeed={styleSettings.fadeSpeed}
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

  const compositionDurationInFrames = useMemo(() => getCompositionDurationInFrames(), []);

  return (
    <LyricsProvider>
      {/* 歌詞表示 - プレビューと完全一致 */}
      <Composition
        id="LyricsMatch"
        component={LyricsMatch}
        durationInFrames={compositionDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
        backgroundColor="transparent"
      />
    </LyricsProvider>
  );
};
