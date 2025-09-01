import React, { useState, useRef, useEffect } from 'react';
import { LyricsLine } from './LyricsEditor';
import { StyleSettings } from './StyleControls';

interface IntegratedLyricsEditorProps {
  lyrics: LyricsLine[];
  audioFile?: string;
  styleSettings: StyleSettings;
  onLyricsChange: (lyrics: LyricsLine[]) => void;
}

export const IntegratedLyricsEditor: React.FC<IntegratedLyricsEditorProps> = ({
  lyrics,
  audioFile,
  styleSettings,
  onLyricsChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 現在再生中の歌詞行
  const currentLyricsIndex = lyrics.findIndex(
    line => currentTime >= line.startTime && currentTime <= line.endTime
  );

  // 音声制御
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 歌詞のタイミング調整
  const updateLyricTiming = (index: number, startTime: number, endTime: number) => {
    const newLyrics = [...lyrics];
    newLyrics[index] = {
      ...newLyrics[index],
      startTime,
      endTime,
    };
    onLyricsChange(newLyrics);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#1a1a1a',
    color: 'white',
    fontFamily: 'system-ui',
  };

  const previewStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    position: 'relative',
    minHeight: '300px',
  };

  const lyricsDisplayStyle: React.CSSProperties = {
    fontSize: `${styleSettings.fontSize}px`,
    fontFamily: styleSettings.fontFamily,
    color: styleSettings.fontColor,
    textAlign: 'center',
    WebkitTextStroke: `${styleSettings.strokeWidth}px ${styleSettings.strokeColor}`,
    fontWeight: 'bold',
    lineHeight: 1.2,
    maxWidth: '80%',
  };

  const controlsStyle: React.CSSProperties = {
    padding: '20px',
    borderTop: '1px solid #333',
  };

  const timelineStyle: React.CSSProperties = {
    marginTop: '20px',
    borderTop: '1px solid #333',
    padding: '20px',
    maxHeight: '300px',
    overflowY: 'auto',
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={containerStyle}>
      {/* 音声要素 */}
      {audioFile && (
        <audio
          ref={audioRef}
          src={audioFile}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* プレビューエリア */}
      <div style={previewStyle}>
        {currentLyricsIndex >= 0 && (
          <div style={lyricsDisplayStyle}>
            {lyrics[currentLyricsIndex].text}
          </div>
        )}
        
        {/* 時間表示 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontSize: '14px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '5px 10px',
          borderRadius: '3px',
        }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* 音声コントロール */}
      <div style={controlsStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={togglePlay}
            disabled={!audioFile}
            style={{
              backgroundColor: audioFile ? '#4f46e5' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 20px',
              cursor: audioFile ? 'pointer' : 'not-allowed',
              fontSize: '16px',
            }}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          {/* シークバー */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            disabled={!audioFile}
            style={{
              flex: 1,
              height: '5px',
              cursor: 'pointer',
            }}
          />

          <span style={{ fontSize: '12px', color: '#ccc' }}>
            現在: 行{currentLyricsIndex + 1} / {lyrics.length}
          </span>
        </div>
      </div>

      {/* タイムラインエディター */}
      <div style={timelineStyle}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          🎵 歌詞タイムライン調整
        </h3>
        
        {lyrics.map((line, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              backgroundColor: index === currentLyricsIndex ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
              borderRadius: '4px',
              marginBottom: '5px',
              fontSize: '14px',
            }}
          >
            <span style={{ minWidth: '30px' }}>{index + 1}.</span>
            
            <span style={{ flex: 1, color: '#ccc' }}>
              {line.text}
            </span>
            
            <input
              type="number"
              value={line.startTime.toFixed(1)}
              onChange={(e) => updateLyricTiming(index, parseFloat(e.target.value), line.endTime)}
              style={{
                width: '60px',
                padding: '3px',
                backgroundColor: '#333',
                border: '1px solid #555',
                borderRadius: '3px',
                color: 'white',
                fontSize: '12px',
              }}
              step="0.1"
              min="0"
            />
            
            <span style={{ color: '#666' }}>~</span>
            
            <input
              type="number"
              value={line.endTime.toFixed(1)}
              onChange={(e) => updateLyricTiming(index, line.startTime, parseFloat(e.target.value))}
              style={{
                width: '60px',
                padding: '3px',
                backgroundColor: '#333',
                border: '1px solid #555',
                borderRadius: '3px',
                color: 'white',
                fontSize: '12px',
              }}
              step="0.1"
              min="0"
            />
            
            <button
              onClick={() => handleSeek(line.startTime)}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 6px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              ジャンプ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};