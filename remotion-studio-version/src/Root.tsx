import { Composition } from 'remotion';
import { LyricsEditor } from './components/LyricsEditor';
import { generateSampleLyrics } from './utils/aiTiming';

// 歌詞データの型定義
export interface LyricsLine {
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
          lyricsData: generateSampleLyrics(),
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
          lyricsData: generateSampleLyrics(),
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