import { useState, useEffect, useRef } from 'react';
import { LyricsLine } from '../components/LyricsEditor';
import { StyleSettings } from '../components/StyleControls';
import { loadFromLocalStorage, subscribeToChanges } from '../store/localStorageSync';

// デフォルト値
const defaultLyrics: LyricsLine[] = [
  { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
  { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
  { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
  { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
];

const defaultStyleSettings: StyleSettings = {
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

// LocalStorageと同期するカスタムフック
export const useSyncedLyrics = () => {
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(defaultStyleSettings);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 初期読み込み
    const loadData = () => {
      const stored = loadFromLocalStorage();
      if (stored) {
        setLyrics(stored.lyrics);
        setStyleSettings(stored.styleSettings);
      } else {
        setLyrics(defaultLyrics);
        setStyleSettings(defaultStyleSettings);
      }
    };
    
    loadData();
    
    // リアルタイム監視（イベントリスナー）
    const unsubscribe = subscribeToChanges((data) => {
      console.log('🔄 useSyncedLyrics: Data synced', data);
      setLyrics(data.lyrics);
      setStyleSettings(data.styleSettings);
    });
    
    // ポーリング（フォールバック）- Remotionの制約対策
    intervalRef.current = setInterval(() => {
      const stored = loadFromLocalStorage();
      if (stored) {
        setLyrics(stored.lyrics);
        setStyleSettings(stored.styleSettings);
      }
    }, 500); // 500msごとにチェック
    
    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return { lyrics, styleSettings };
};