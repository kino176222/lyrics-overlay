import React from 'react';
import {
  Composition,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
} from 'remotion';

interface LyricsLine {
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

interface DynamicLyricsProps {
  lyricsData: LyricsLine[];
  backgroundImage?: string;
  format: 'youtube' | 'tiktok' | 'instagram';
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  position?: 'bottom' | 'center' | 'top';
  yOffset?: number;
  animationStyle?: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce';
  fadeSpeed?: number;
  durationOffset?: number;
}

const DynamicLyricsOverlay: React.FC<DynamicLyricsProps> = ({
  lyricsData = [],
  backgroundImage,
  format = 'youtube',
  fontFamily = "'Shippori Mincho', 'しっぽり明朝', 'Hiragino Mincho ProN', 'ヒラギノ明朝 ProN', serif",
  fontSize = 48,
  fontColor = '#000000',
  strokeColor = '#FFFFFF',
  strokeWidth = 2,
  position = format === 'youtube' ? 'bottom' : 'center',
  yOffset = 0,
  animationStyle = 'fade',
  fadeSpeed = 0.5,
  durationOffset = 0,
}) => {
  // デバッグ用ログ
  console.log('DynamicLyricsOverlay props:', {
    lyricsDataLength: lyricsData?.length,
    lyricsDataSample: lyricsData?.slice(0, 3),
    format,
    fontSize,
    position
  });
  
  // propsが来ていない場合の警告
  if (!lyricsData || lyricsData.length === 0) {
    console.warn('⚠️ lyricsDataが空です！defaultPropsが使用されています');
  }
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // フレームを秒に変換
  const currentTime = frame / fps;
  
  // 現在表示すべき歌詞を取得
  const getCurrentLyrics = () => {
    return lyricsData.filter(
      line => currentTime >= line.startTime && currentTime <= line.endTime
    );
  };

  const currentLyrics = getCurrentLyrics();

  // 歌詞の位置を計算（yOffsetを考慮）
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

  const lyricsY = getLyricsPosition();

  // アニメーション効果
  const getLineAnimation = (line: LyricsLine, index: number) => {
    const adjustedStartTime = line.startTime + durationOffset;
    const adjustedEndTime = line.endTime + durationOffset;
    const lineStartFrame = adjustedStartTime * fps;
    const lineEndFrame = adjustedEndTime * fps;
    const animationDuration = fadeSpeed * fps; // fadeSpeedを使用

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

    // シンプルなフェードアニメーションのみ
    return {
      opacity: Math.min(fadeIn, fadeOut),
    };
  };

  // 文字の輪郭設定（WebKitストローク方式）
  const textStyle = {
    fontFamily,
    fontSize: `${fontSize}px`,
    color: fontColor,
    textAlign: 'center' as const,
    fontWeight: 'bold',
    WebkitTextStroke: strokeWidth > 0 ? `${Math.max(0.3, strokeWidth * 0.3)}px ${strokeColor}` : 'none',
    lineHeight: 1.2,
  };

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: backgroundImage ? 'transparent' : 'rgba(0, 0, 0, 0)',
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

      {/* 歌詞表示 */}
      <div
        style={{
          position: 'absolute',
          top: position === 'center' ? '50%' : 'auto',
          bottom: position === 'bottom' ? '5%' : 'auto',
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
                transform: `${animation.transform} translateY(${animation.translateY}px)`,
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

// Remotion用のコンポジション設定
export const DynamicLyricsComposition: React.FC = () => {
  return (
    <Composition
      id="DynamicLyrics"
      component={DynamicLyricsOverlay}
      durationInFrames={6000} // 100秒 (60fps)
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{
        lyricsData: [
          { text: "サンプル歌詞1", startTime: 1, endTime: 3 },
          { text: "サンプル歌詞2", startTime: 4, endTime: 6 },
        ],
        format: 'youtube',
      }}
    />
  );
};

// フォーマット別のコンポジション
export const YouTubeComposition: React.FC<DynamicLyricsProps> = (props) => (
  <DynamicLyricsOverlay {...props} format="youtube" />
);

export const TikTokComposition: React.FC<DynamicLyricsProps> = (props) => (
  <DynamicLyricsOverlay {...props} format="tiktok" />
);

export const InstagramComposition: React.FC<DynamicLyricsProps> = (props) => (
  <DynamicLyricsOverlay {...props} format="instagram" />
);

export default DynamicLyricsOverlay;