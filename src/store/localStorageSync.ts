import { LyricsLine } from '../components/LyricsEditor';
import { StyleSettings } from '../components/StyleControls';

const STORAGE_KEY = 'remotion-lyrics-data';
const SYNC_EVENT = 'lyrics-data-updated';

export interface StoredData {
  lyrics: LyricsLine[];
  styleSettings: StyleSettings;
  audioFile?: string;
  backgroundImage?: string;
  lastUpdated: number;
}

// LocalStorageに保存
export const saveToLocalStorage = (data: Omit<StoredData, 'lastUpdated'>) => {
  try {
    const storageData: StoredData = {
      ...data,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    
    // カスタムイベントを発火して他のタブ/ウィンドウに通知
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: storageData }));
    
    console.log('✅ Data saved to localStorage:', storageData);
    return true;
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
    return false;
  }
};

// LocalStorageから読み込み
export const loadFromLocalStorage = (): StoredData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as StoredData;
      console.log('✅ Data loaded from localStorage:', data);
      return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to load from localStorage:', error);
    return null;
  }
};

// リアルタイム同期のリスナー設定
export const subscribeToChanges = (callback: (data: StoredData) => void) => {
  // LocalStorage変更の監視（他のタブからの変更）
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue) as StoredData;
        console.log('📡 Storage changed from another tab:', data);
        callback(data);
      } catch (error) {
        console.error('Failed to parse storage data:', error);
      }
    }
  };

  // カスタムイベントの監視（同じタブ内の変更）
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<StoredData>;
    console.log('📡 Data updated in same tab:', customEvent.detail);
    callback(customEvent.detail);
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener(SYNC_EVENT, handleCustomEvent);

  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener(SYNC_EVENT, handleCustomEvent);
  };
};

// デバッグ用：ストレージをクリア
export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ Storage cleared');
};