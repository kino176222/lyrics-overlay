import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  Audio,
} from 'remotion';

// Web版から継承した歌詞データ型
export interface LyricsLine {
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface LyricsEditorProps {
  lyricsData: LyricsLine[];
  backgroundImage?: string;
  audioFile?: string;
  format: 'youtube' | 'vertical';
  
  // フォント設定（Remotion Studio で調整可能）
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  
  // レイアウト設定
  position?: 'bottom' | 'center' | 'top';
  yOffset?: number;
  
  // アニメーション設定
  animationStyle?: 'fade' | 'slide' | 'scale' | 'bounce';
  fadeSpeed?: number;
  durationOffset?: number;
}

export const LyricsEditor: React.FC<LyricsEditorProps> = ({
  lyricsData = [],
  backgroundImage,
  audioFile,
  format = 'youtube',
  fontFamily = "'Shippori Mincho', 'しっぽり明朝', 'Hiragino Mincho ProN', 'ヒラギノ明朝 ProN', serif",
  fontSize = format === 'youtube' ? 48 : 54,
  fontColor = '#000000',
  strokeColor = '#FFFFFF',
  strokeWidth = 2,
  position = format === 'youtube' ? 'bottom' : 'center',
  yOffset = 0,
  animationStyle = 'fade',
  fadeSpeed = 0.5,
  durationOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // フレームを秒に変換
  const currentTime = frame / fps;
  
  // 現在表示すべき歌詞を取得
  const getCurrentLyrics = () => {
    return lyricsData.filter(
      line => currentTime >= (line.startTime + durationOffset) && 
              currentTime <= (line.endTime + durationOffset)
    );
  };

  const currentLyrics = getCurrentLyrics();

  // 歌詞の位置を計算
  const getLyricsPosition = () => {
    let basePosition: number;
    switch (position) {
      case 'top':
        basePosition = height * 0.15;
        break;
      case 'center':
        basePosition = height * 0.5;
        break;
      case 'bottom':
      default:
        basePosition = height * 0.85;
        break;
    }
    return basePosition + yOffset;
  };

  // アニメーション効果（Web版から改良）
  const getLineAnimation = (line: LyricsLine, index: number) => {
    const adjustedStartTime = line.startTime + durationOffset;
    const adjustedEndTime = line.endTime + durationOffset;
    const lineStartFrame = adjustedStartTime * fps;
    const lineEndFrame = adjustedEndTime * fps;
    const animationDuration = fadeSpeed * fps;

    // フェードイン
    const fadeIn = interpolate(
      frame,
      [lineStartFrame, lineStartFrame + animationDuration],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      }
    );

    // フェードアウト
    const fadeOut = interpolate(
      frame,
      [lineEndFrame - animationDuration, lineEndFrame],
      [1, 0],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.cubic),
      }
    );

    // アニメーションスタイルに応じた効果
    let transform = '';
    let scale = 1;
    
    switch (animationStyle) {
      case 'scale':
        scale = interpolate(fadeIn, [0, 1], [0.8, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        break;
      case 'slide':
        const slideY = interpolate(fadeIn, [0, 1], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        transform = `translateY(${slideY}px)`;
        break;
      case 'bounce':
        const bounceScale = interpolate(fadeIn, [0, 0.5, 1], [0.8, 1.1, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.elastic(1),
        });
        scale = bounceScale;
        break;
    }

    return {
      opacity: Math.min(fadeIn, fadeOut),
      transform: `scale(${scale}) ${transform}`,
    };
  };

  // テキストスタイル（WebkitTextStroke使用）
  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${fontSize}px`,
    color: fontColor,
    textAlign: 'center',
    fontWeight: 'bold',
    WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : 'none',
    lineHeight: 1.2,
    textShadow: 'none', // WebkitTextStrokeと競合を避ける
  };

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: 'transparent',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: position === 'center' ? 'center' : 'flex-end',
        alignItems: 'center',
      }}
    >
      {/* 背景画像 */}
      {backgroundImage && (
        <Img
          src={backgroundImage}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
            objectFit: 'cover',
          }}
        />
      )}

      {/* 音声ファイル */}
      {audioFile && (
        <Audio src={audioFile} />
      )}

      {/* 歌詞表示 */}
      <div
        style={{
          position: 'absolute',
          top: position === 'center' ? '50%' : 'auto',
          bottom: position === 'bottom' ? '10%' : 'auto',
          left: '50%',
          transform: position === 'center' 
            ? 'translate(-50%, -50%)' 
            : 'translateX(-50%)',
          width: '90%',
          maxWidth: width * 0.9,
          zIndex: 10,
        }}
      >
        {currentLyrics.map((line, index) => {
          const animation = getLineAnimation(line, index);
          
          return (
            <div
              key={`${line.text}-${line.startTime}`}
              style={{
                ...textStyle,
                opacity: animation.opacity,
                transform: animation.transform,
                marginBottom: '8px',
                transition: 'all 0.1s ease-out',
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};