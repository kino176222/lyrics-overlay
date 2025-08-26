import React from 'react';
import { Composition } from 'remotion';
import { LyricsOverlay } from './compositions/LyricsOverlay';
import { LyricsWithAudio } from './compositions/LyricsWithAudio';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LyricsOverlay"
        component={LyricsOverlay}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LyricsWithAudio"
        component={LyricsWithAudio}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};