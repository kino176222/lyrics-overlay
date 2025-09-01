// Web版から移植した AI歌詞タイミング認識
export interface LyricsLine {
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface AudioAnalysisResult {
  words: Array<{
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  phrases: LyricsLine[];
}

/**
 * MP3ファイルから歌詞のタイミングを自動認識
 * Web版のai-timing.jsから移植・改良
 */
export class AudioLyricsSync {
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    this.audioContext = new AudioContext();
  }

  /**
   * MP3ファイルを読み込んでオーディオバッファに変換
   */
  async loadAudio(audioFile: File): Promise<AudioBuffer> {
    const arrayBuffer = await audioFile.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return this.audioBuffer;
  }

  /**
   * 歌詞テキストを行に分割
   */
  parseLyricsText(lyricsText: string): string[] {
    return lyricsText
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * 音声解析による自動タイミング認識
   * 実際のWeb Speech API or 簡易版の実装
   */
  async analyzeAudio(): Promise<number[]> {
    if (!this.audioBuffer) {
      throw new Error('Audio not loaded');
    }

    // 簡易版: 音量ベースの区間検出
    const audioData = this.audioBuffer.getChannelData(0);
    const sampleRate = this.audioBuffer.sampleRate;
    const windowSize = sampleRate * 0.1; // 100msウィンドウ
    const threshold = 0.02; // 音量閾値
    
    const energyLevels: number[] = [];
    
    // エネルギーレベル計算
    for (let i = 0; i < audioData.length; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize && i + j < audioData.length; j++) {
        energy += Math.abs(audioData[i + j]);
      }
      energy /= windowSize;
      energyLevels.push(energy);
    }
    
    // 音声区間の検出
    const segments: number[] = [];
    let inSpeech = false;
    
    for (let i = 0; i < energyLevels.length; i++) {
      const currentTime = (i * windowSize) / sampleRate;
      
      if (!inSpeech && energyLevels[i] > threshold) {
        segments.push(currentTime);
        inSpeech = true;
      } else if (inSpeech && energyLevels[i] <= threshold) {
        // 無音が続く場合は区間終了
        let silentCount = 0;
        for (let j = i; j < Math.min(i + 5, energyLevels.length); j++) {
          if (energyLevels[j] <= threshold) silentCount++;
        }
        if (silentCount >= 3) {
          segments.push(currentTime);
          inSpeech = false;
        }
      }
    }
    
    return segments;
  }

  /**
   * 歌詞行と音声区間をマッチング
   */
  async syncLyricsWithAudio(
    lyricsLines: string[], 
    audioFile: File
  ): Promise<LyricsLine[]> {
    await this.loadAudio(audioFile);
    const segments = await this.analyzeAudio();
    
    const result: LyricsLine[] = [];
    const avgDuration = segments.length > 1 ? 
      (segments[segments.length - 1] - segments[0]) / Math.max(1, lyricsLines.length) : 
      3.0; // デフォルト3秒
    
    // 歌詞行と音声区間をマッピング
    for (let i = 0; i < lyricsLines.length; i++) {
      let startTime: number;
      let endTime: number;
      
      if (segments.length >= 2 && i * 2 < segments.length - 1) {
        // 実際の音声区間を使用
        startTime = segments[i * 2] || i * avgDuration;
        endTime = segments[i * 2 + 1] || startTime + avgDuration;
      } else {
        // 均等分割
        startTime = i * avgDuration;
        endTime = startTime + avgDuration * 0.8; // 少し短めに
      }
      
      result.push({
        text: lyricsLines[i],
        startTime: Math.max(0, startTime),
        endTime: endTime,
        confidence: segments.length >= 2 ? 0.8 : 0.5
      });
    }
    
    return result;
  }

  /**
   * 使いやすいラッパー関数
   */
  static async generateTimedLyrics(
    audioFile: File, 
    lyricsText: string
  ): Promise<LyricsLine[]> {
    const sync = new AudioLyricsSync();
    const lyricsLines = sync.parseLyricsText(lyricsText);
    return await sync.syncLyricsWithAudio(lyricsLines, audioFile);
  }
}

/**
 * Remotion Studio用のユーティリティ関数
 */
export const generateSampleLyrics = (): LyricsLine[] => {
  return [
    { text: "守りたいものが増えていくのに", startTime: 1, endTime: 4, confidence: 1.0 },
    { text: "思考のスピードに追いつけなくて", startTime: 5, endTime: 8, confidence: 1.0 },
    { text: "今日も迷子になりそう", startTime: 9, endTime: 12, confidence: 1.0 },
    { text: "でも歩き続けていこう", startTime: 13, endTime: 16, confidence: 1.0 },
  ];
};

export const adjustLyricsTiming = (
  lyrics: LyricsLine[],
  globalOffset: number,
  speedMultiplier: number = 1.0
): LyricsLine[] => {
  return lyrics.map(line => ({
    ...line,
    startTime: (line.startTime * speedMultiplier) + globalOffset,
    endTime: (line.endTime * speedMultiplier) + globalOffset,
  }));
};