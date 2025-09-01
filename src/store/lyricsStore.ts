// シンプルなグローバル状態管理
import { LyricsLine } from '../components/LyricsEditor';
import { StyleSettings } from '../components/StyleControls';

interface LyricsStore {
  lyrics: LyricsLine[];
  audioFile?: string;
  backgroundImage?: string;
  styleSettings?: StyleSettings;
}

// グローバル状態
let store: LyricsStore = {
  lyrics: [],
};

// リスナー
const listeners: Array<(store: LyricsStore) => void> = [];

// 状態更新
export const updateLyricsStore = (updates: Partial<LyricsStore>) => {
  store = { ...store, ...updates };
  listeners.forEach(listener => listener(store));
  console.log('Store updated:', store);
};

// 状態取得
export const getLyricsStore = (): LyricsStore => store;

// リスナー登録
export const subscribeLyricsStore = (listener: (store: LyricsStore) => void) => {
  listeners.push(listener);
  // 初回実行
  listener(store);
  
  // クリーンアップ関数を返す
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};