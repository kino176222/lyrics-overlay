import { Composition } from 'remotion';
import { LyricsEditor, LyricsLine } from './components/LyricsEditor';
import React from 'react';

// シンプルな動画プレビューコンポーネント
const VideoPreview: React.FC<{ format: 'youtube' | 'vertical' }> = ({ format }) => {
  // JSONファイルから歌詞データを読み込む（シンプルな静的データ）
  const lyricsData: LyricsLine[] = [
    { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
    { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
    { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
    { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
    { text: "夜空に輝く星のように", startTime: 12, endTime: 15, confidence: 1.0 },
    { text: "君と過ごした時間は", startTime: 15, endTime: 18, confidence: 1.0 },
    { text: "永遠に消えることはない", startTime: 18, endTime: 21, confidence: 1.0 },
    { text: "心に刻まれている", startTime: 21, endTime: 24, confidence: 1.0 },
  ];

  return (
    <LyricsEditor
      format={format}
      lyricsData={lyricsData}
      fontFamily="'Shippori Mincho', serif"
      fontSize={format === 'youtube' ? 48 : 54}
      fontColor="#FFFFFF"
      strokeColor="#000000"
      strokeWidth={2}
      position="bottom"
    />
  );
};

// KISSの原則：シンプルな2つのCompositionのみ
export const SimpleRemotionRoot: React.FC = () => {
  return (
    <>
      {/* YouTube横動画 */}
      <Composition
        id="YouTube"
        component={() => <VideoPreview format="youtube" />}
        durationInFrames={720} // 24秒 = 720フレーム（30fps）
        fps={30}
        width={1920}
        height={1080}
      />

      {/* TikTok縦動画 */}
      <Composition
        id="TikTok"
        component={() => <VideoPreview format="vertical" />}
        durationInFrames={720}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};