import React, { useState, useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, getRemotionEnvironment } from 'remotion';
import { SafeWaveformTimeline } from './SafeWaveformTimeline';
import { LyricsEditor, LyricsLine } from './LyricsEditor';
import { StyleSettings } from './StyleControls';

// 統合エディターとプレビュー
export const UnifiedStudio: React.FC = () => {
  // レンダリング中かどうかを判定
  const isRendering = getRemotionEnvironment().isRendering;

  // 初期データ（localStorageから復元）
  const [lyrics, setLyrics] = useState<LyricsLine[]>(() => {
    const saved = localStorage.getItem('unifiedLyrics');
    if (saved) return JSON.parse(saved);
    return [
      { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
      { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
      { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
      { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
    ];
  });

  const [styleSettings, setStyleSettings] = useState<StyleSettings>(() => {
    const saved = localStorage.getItem('unifiedStyles');
    if (saved) return JSON.parse(saved);
    return {
      fontFamily: "'Shippori Mincho', 'しっぽり明朝', serif",
      fontSize: 48,
      fontWeight: 'bold',
      fontColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
      position: 'bottom',
      yOffset: 0,
      animationStyle: 'fade',
      fadeSpeed: 0.5,
    };
  });

  // データをlocalStorageに保存
  useEffect(() => {
    if (!isRendering) {
      localStorage.setItem('unifiedLyrics', JSON.stringify(lyrics));
    }
  }, [lyrics, isRendering]);

  useEffect(() => {
    if (!isRendering) {
      localStorage.setItem('unifiedStyles', JSON.stringify(styleSettings));
    }
  }, [styleSettings, isRendering]);

  const [audioFile, setAudioFile] = useState<string | undefined>();
  const [previewFormat, setPreviewFormat] = useState<'youtube' | 'vertical'>('youtube');
  const [selectedLyricIndex, setSelectedLyricIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // 編集データが更新されたときのハンドラー
  const handleLyricsChange = (newLyrics: LyricsLine[]) => {
    console.log('🎵 歌詞データ更新:', newLyrics.length, 'lines');
    setLyrics(newLyrics);
  };

  const handleStyleChange = (newSettings: StyleSettings) => {
    console.log('🎨 スタイル更新:', newSettings);
    setStyleSettings(newSettings);
  };

  // 音声ファイルアップロード
  const handleAudioUpload = (file: string) => {
    console.log('🎵 音声ファイル:', file);
    setAudioFile(file);
  };

  // 音楽の進行に基づいて歌詞を自動更新
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    // 現在時刻に該当する歌詞を見つけて自動選択
    const currentLyricIndex = lyrics.findIndex(line => 
      time >= line.startTime && time <= line.endTime
    );
    if (currentLyricIndex >= 0 && currentLyricIndex !== selectedLyricIndex) {
      setSelectedLyricIndex(currentLyricIndex);
    }
  };

  // レンダリング時は動画のみを表示
  if (isRendering) {
    return (
      <LyricsEditor
        format={previewFormat}
        lyricsData={lyrics}
        fontFamily={styleSettings.fontFamily}
        fontSize={styleSettings.fontSize}
        fontColor={styleSettings.fontColor}
        strokeColor={styleSettings.strokeColor}
        strokeWidth={styleSettings.strokeWidth}
        position={styleSettings.position}
        yOffset={styleSettings.yOffset}
        animationStyle={styleSettings.animationStyle}
        fadeSpeed={styleSettings.fadeSpeed}
        audioFile={audioFile}
      />
    );
  }

  // 編集モード時は通常のUIを表示
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#0f0f0f',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* 左側：編集パネル */}
      <div style={{
        width: '50%',
        borderRight: '2px solid #333',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a'
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          backgroundColor: '#222'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            🎵 歌詞エディター
          </h2>
          <p style={{
            margin: '5px 0 0',
            color: '#888',
            fontSize: '13px'
          }}>
            音声をアップロードして、タイミングを調整してください
          </p>
        </div>

        {/* 編集エリア */}
        <div style={{ 
          flex: 1,
          overflow: 'auto'
        }}>
          <SafeWaveformTimeline
            lyrics={lyrics}
            audioFile={audioFile}
            styleSettings={styleSettings}
            onLyricsChange={handleLyricsChange}
            onStyleChange={handleStyleChange}
            onAudioUpload={handleAudioUpload}
            selectedLyricIndex={selectedLyricIndex}
            onSelectedLyricChange={setSelectedLyricIndex}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      </div>

      {/* 右側：プレビューエリア */}
      <div style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000'
      }}>
        {/* プレビューヘッダー */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          backgroundColor: '#222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            📺 プレビュー
          </h3>
          
          {/* フォーマット切り替え */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPreviewFormat('youtube')}
              style={{
                padding: '6px 12px',
                backgroundColor: previewFormat === 'youtube' ? '#4CAF50' : '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              YouTube (16:9)
            </button>
            <button
              onClick={() => setPreviewFormat('vertical')}
              style={{
                padding: '6px 12px',
                backgroundColor: previewFormat === 'vertical' ? '#4CAF50' : '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              TikTok (9:16)
            </button>
          </div>
        </div>

        {/* プレビュー表示 */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#000'
        }}>
          <div style={{
            width: previewFormat === 'youtube' ? '100%' : '50%',
            maxWidth: previewFormat === 'youtube' ? '960px' : '540px',
            aspectRatio: previewFormat === 'youtube' ? '16/9' : '9/16',
            backgroundColor: '#000',
            boxShadow: '0 0 30px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <LyricsEditor
              format={previewFormat}
              lyricsData={lyrics}
              fontFamily={styleSettings.fontFamily}
              fontSize={styleSettings.fontSize}
              fontColor={styleSettings.fontColor}
              strokeColor={styleSettings.strokeColor}
              strokeWidth={styleSettings.strokeWidth}
              position={styleSettings.position}
              yOffset={styleSettings.yOffset}
              animationStyle={styleSettings.animationStyle}
              fadeSpeed={styleSettings.fadeSpeed}
              audioFile={audioFile}
            />
          </div>
        </div>

        {/* 書き出し情報 */}
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #333',
          backgroundColor: '#1a1a1a'
        }}>
          <p style={{
            margin: 0,
            color: '#888',
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
            💡 ヒント: Renderボタンを押すと、UIが自動的に隠れて動画のみが書き出されます
          </p>
        </div>
      </div>
    </div>
  );
};