import React, { useState, useRef, useEffect } from 'react';
import { LyricsLine } from './LyricsEditor';
import { SimpleStyleControls, StyleSettings } from './SimpleStyleControls';
import { TextInputUploader } from './TextInputUploader';

interface SafeWaveformTimelineProps {
  lyrics: LyricsLine[];
  audioFile?: string;
  styleSettings: StyleSettings;
  onLyricsChange: (lyrics: LyricsLine[]) => void;
  onStyleChange: (settings: StyleSettings) => void;
  onAudioUpload?: (file: string) => void;
  selectedLyricIndex?: number;
  onSelectedLyricChange?: (index: number) => void;
  onTimeUpdate?: (time: number) => void;
}

// Remotion内で安全に動作するWaveformTimeline（音声制御を分離）
export const SafeWaveformTimeline: React.FC<SafeWaveformTimelineProps> = ({
  lyrics,
  audioFile,
  styleSettings,
  onLyricsChange,
  onStyleChange,
  onAudioUpload,
  selectedLyricIndex: localSelectedIndex = 0,
  onSelectedLyricChange,
  onTimeUpdate,
}) => {
  const [showTextInput, setShowTextInput] = useState(!lyrics.length);
  const [showStyleControls, setShowStyleControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 音声ファイルの設定（安全な再生付き）
  useEffect(() => {
    if (audioFile) {
      const audio = new Audio(audioFile);
      audioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
        console.log('🎵 音声ファイル情報取得:', audio.duration, 'seconds');
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        onTimeUpdate?.(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      return () => {
        audio.pause();
        audio.remove();
      };
    }
  }, [audioFile]);

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

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // シンプルなタイムライン描画
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // タイムライン
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // 歌詞ブロック描画
    lyrics.forEach((line, index) => {
      const startX = (line.startTime / duration) * canvas.width;
      const endX = (line.endTime / duration) * canvas.width;
      const width = endX - startX;
      
      // ブロック背景
      ctx.fillStyle = localSelectedIndex === index ? '#4CAF50' : '#555';
      ctx.fillRect(startX, 20, width, canvas.height - 40);
      
      // ブロック枠
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, 20, width, canvas.height - 40);
      
      // テキスト
      if (width > 30) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter';
        ctx.fillText(
          line.text.substring(0, Math.floor(width / 6)), 
          startX + 4, 
          canvas.height / 2 + 4
        );
      }
    });

    // 現在時刻インジケーター
    const currentX = (currentTime / duration) * canvas.width;
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, canvas.height);
    ctx.stroke();
  }, [lyrics, duration, currentTime, localSelectedIndex]);

  // タイムラインクリック
  const handleTimelineClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;
    
    seekTo(clickTime);

    // 歌詞選択
    const clickedLyricIndex = lyrics.findIndex(line => 
      clickTime >= line.startTime && clickTime <= line.endTime
    );
    if (clickedLyricIndex >= 0 && onSelectedLyricChange) {
      onSelectedLyricChange(clickedLyricIndex);
    }
  };

  // 歌詞編集
  const updateLyricText = (index: number, newText: string) => {
    const newLyrics = [...lyrics];
    newLyrics[index].text = newText;
    onLyricsChange(newLyrics);
  };

  // タイミング調整
  const adjustTiming = (index: number, type: 'start' | 'end', delta: number) => {
    const newLyrics = [...lyrics];
    if (type === 'start') {
      newLyrics[index].startTime = Math.max(0, newLyrics[index].startTime + delta);
    } else {
      newLyrics[index].endTime = Math.max(
        newLyrics[index].startTime + 0.5, 
        newLyrics[index].endTime + delta
      );
    }
    onLyricsChange(newLyrics);
  };

  // 音声ファイルアップロード
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAudioUpload?.(url);
      console.log('🎵 音声ファイルアップロード:', file.name);
    }
  };

  // 歌詞追加
  const addLyric = () => {
    const lastTime = lyrics.length > 0 ? lyrics[lyrics.length - 1].endTime : 0;
    const newLyric: LyricsLine = {
      text: "新しい歌詞",
      startTime: lastTime,
      endTime: lastTime + 3,
      confidence: 1.0
    };
    onLyricsChange([...lyrics, newLyric]);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      height: '100%'
    }}>
      {/* ツールバー */}
      <div style={{ 
        padding: '15px',
        borderBottom: '1px solid #333',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🎵 音声アップロード
        </button>
        
        {audioFile && (
          <button
            onClick={togglePlay}
            style={{
              padding: '8px 16px',
              backgroundColor: isPlaying ? '#FF5722' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isPlaying ? '⏸️ 停止' : '▶️ 再生'}
          </button>
        )}
        
        <button
          onClick={() => setShowTextInput(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📝 歌詞貼り付け
        </button>
        
        <button
          onClick={addLyric}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          + 歌詞追加
        </button>

        <button
          onClick={() => setShowStyleControls(!showStyleControls)}
          style={{
            padding: '8px 16px',
            backgroundColor: showStyleControls ? '#FF9800' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🎨 スタイル設定
        </button>

        <div style={{ 
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#888'
        }}>
          {audioFile ? `⏱️ ${duration.toFixed(1)}s` : '音声なし'}
        </div>
      </div>

      {/* タイムライン */}
      <div style={{ padding: '20px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          onClick={handleTimelineClick}
          style={{
            width: '100%',
            height: '120px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* スタイルコントロール */}
      {showStyleControls && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid #333',
          borderBottom: '1px solid #333',
          backgroundColor: '#222'
        }}>
          <SimpleStyleControls
            settings={styleSettings}
            onSettingsChange={onStyleChange}
          />
        </div>
      )}

      {/* 歌詞リスト */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '0 20px 20px'
      }}>
        {lyrics.map((line, index) => (
          <div
            key={index}
            onClick={() => {
              onSelectedLyricChange?.(index);
              seekTo(line.startTime); // 歌詞のスタート地点にジャンプ
            }}
            style={{
              marginBottom: '10px',
              padding: '12px',
              backgroundColor: localSelectedIndex === index ? '#333' : '#222',
              borderRadius: '6px',
              border: localSelectedIndex === index ? '2px solid #4CAF50' : '1px solid #444',
              cursor: 'pointer', // クリック可能であることを示す
              transition: 'all 0.2s ease' // スムーズな遷移
            }}
          >
            <input
              type="text"
              value={line.text}
              onChange={(e) => updateLyricText(index, e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                marginBottom: '8px',
                outline: 'none'
              }}
            />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11px',
              color: '#aaa'
            }}>
              <span>
                {line.startTime.toFixed(1)}s - {line.endTime.toFixed(1)}s
              </span>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => adjustTiming(index, 'start', -0.1)}>-0.1</button>
                <button onClick={() => adjustTiming(index, 'start', 0.1)}>+0.1</button>
                <span style={{ margin: '0 8px' }}>|</span>
                <button onClick={() => adjustTiming(index, 'end', -0.1)}>-0.1</button>
                <button onClick={() => adjustTiming(index, 'end', 0.1)}>+0.1</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* テキスト入力モード */}
      {showTextInput && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#222',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <TextInputUploader
              onTextSubmit={(text) => {
                // テキストを歌詞に変換
                const lines = text.split('\n').filter(line => line.trim());
                const newLyrics: LyricsLine[] = lines.map((text, index) => ({
                  text: text.trim(),
                  startTime: index * 3,
                  endTime: (index + 1) * 3,
                  confidence: 1.0
                }));
                onLyricsChange(newLyrics);
                setShowTextInput(false);
              }}
            />
            <button
              onClick={() => setShowTextInput(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};