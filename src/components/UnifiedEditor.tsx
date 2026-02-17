import React, { useState, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { WaveformTimeline } from './WaveformTimeline';
import { LyricsEditor, LyricsLine } from './LyricsEditor';
import { StyleSettings } from './StyleControls';
import { saveToLocalStorage, loadFromLocalStorage } from '../store/localStorageSync';

// 統合エディター（編集とプレビューを同時表示）
export const UnifiedEditor: React.FC = () => {
  const stored = loadFromLocalStorage();
  const [lyrics, setLyrics] = useState<LyricsLine[]>(stored?.lyrics || [
    { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
    { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
    { text: "時が過ぎても変わらずに", startTime: 6, endTime: 9, confidence: 1.0 },
    { text: "心の中で歌い続ける", startTime: 9, endTime: 12, confidence: 1.0 },
  ]);
  
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(stored?.styleSettings || {
    fontFamily: "'Shippori Mincho', 'しっぽり明朝', serif",
    fontSize: 24,
    fontWeight: 'bold',
    fontColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 1,
    position: 'bottom',
    yOffset: 0,
    animationStyle: 'fade',
    fadeSpeed: 0.5,
  });
  
  const [audioFile, setAudioFile] = useState<string | undefined>(stored?.audioFile);
  const [previewMode, setPreviewMode] = useState<'youtube' | 'vertical'>('youtube');

  const handleLyricsChange = (newLyrics: LyricsLine[]) => {
    setLyrics(newLyrics);
    saveToLocalStorage({
      lyrics: newLyrics,
      styleSettings,
      audioFile,
    });
  };

  const handleStyleChange = (newSettings: StyleSettings) => {
    setStyleSettings(newSettings);
    saveToLocalStorage({
      lyrics,
      styleSettings: newSettings,
      audioFile,
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      {/* 上部：編集UI */}
      <div style={{ 
        flex: '0 0 60%', 
        borderBottom: '2px solid #333',
        overflow: 'auto'
      }}>
        <WaveformTimeline
          lyrics={lyrics}
          audioFile={audioFile}
          styleSettings={styleSettings}
          onLyricsChange={handleLyricsChange}
          onStyleChange={handleStyleChange}
        />
      </div>
      
      {/* 下部：プレビュー */}
      <div style={{ 
        flex: '0 0 40%', 
        position: 'relative',
        backgroundColor: '#000'
      }}>
        {/* プレビューモード切り替え */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 100,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setPreviewMode('youtube')}
            style={{
              padding: '8px 16px',
              backgroundColor: previewMode === 'youtube' ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            YouTube (16:9)
          </button>
          <button
            onClick={() => setPreviewMode('vertical')}
            style={{
              padding: '8px 16px',
              backgroundColor: previewMode === 'vertical' ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            TikTok (9:16)
          </button>
        </div>
        
        {/* プレビューエリア */}
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: previewMode === 'youtube' ? '100%' : '30%',
            maxWidth: previewMode === 'youtube' ? '800px' : '300px',
            aspectRatio: previewMode === 'youtube' ? '16/9' : '9/16',
            backgroundColor: '#fff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <LyricsEditor
              format={previewMode}
              lyricsData={lyrics}
              fontFamily={styleSettings.fontFamily}
              fontSize={previewMode === 'youtube' ? Math.max(styleSettings.fontSize, 48) : Math.max(styleSettings.fontSize, 54)}
              fontColor={styleSettings.fontColor}
              strokeColor={styleSettings.strokeColor}
              strokeWidth={styleSettings.strokeWidth}
              position={styleSettings.position}
            />
          </div>
        </div>
      </div>
    </div>
  );
};