import React from 'react';
import { Composition } from 'remotion';
import { LyricsOverlay } from './compositions/LyricsOverlay';
import { LyricsWithAudio } from './compositions/LyricsWithAudio';
import DynamicLyricsOverlay from './compositions/DynamicLyricsOverlay';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 既存のコンポーネント */}
      <Composition
        id="LyricsOverlay"
        component={LyricsOverlay}
        durationInFrames={7920}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LyricsWithAudio"
        component={LyricsWithAudio}
        durationInFrames={7920}
        fps={30}
        width={1920}
        height={1080}
      />
      
      {/* 新しい動的歌詞コンポーネント */}
      <Composition
        id="DynamicLyrics"
        component={DynamicLyricsOverlay}
        durationInFrames={3000} // 100秒
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: Math.max(3000, (props.lyricsData?.length || 0) * 150),
          };
        }}
      />
      
      {/* TikTok/Instagram用縦動画 */}
      <Composition
        id="DynamicLyricsVertical"
        component={DynamicLyricsOverlay}
        durationInFrames={3000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          lyricsData: [
            { text: "サンプル歌詞1", startTime: 1, endTime: 3 },
            { text: "サンプル歌詞2", startTime: 4, endTime: 6 },
          ],
          format: 'tiktok' as const,
        }}
      />
    </>
  );
};