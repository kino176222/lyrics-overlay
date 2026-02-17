import React, { useState, useRef, useEffect } from 'react';
import { LyricsLine } from './LyricsEditor';
import { StyleSettings } from './StyleControls';
import { TextInputUploader } from './TextInputUploader';

interface WaveformTimelineProps {
  lyrics: LyricsLine[];
  audioFile?: string;
  styleSettings: StyleSettings;
  onLyricsChange: (lyrics: LyricsLine[]) => void;
  onStyleChange: (settings: StyleSettings) => void;
  onAudioFileChange?: (audioFile: string | undefined) => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  lyrics,
  audioFile,
  styleSettings,
  onLyricsChange,
  onStyleChange,
  onAudioFileChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedLyricIndex, setSelectedLyricIndex] = useState<number | null>(null);
  const [showTextInput, setShowTextInput] = useState(!lyrics.length);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 現在再生中の歌詞
  const currentLyricIndex = lyrics.findIndex(
    line => currentTime >= line.startTime && currentTime <= line.endTime
  );

  // 長押し機能のヘルパー関数
  const handleMouseDown = (action: () => void) => {
    // 最初のクリック
    action();
    
    // 長押し検知（500ms後）
    pressTimerRef.current = setTimeout(() => {
      // 高速連続実行（100msごと）
      longPressIntervalRef.current = setInterval(action, 100);
    }, 500);
  };

  const handleMouseUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      handleMouseUp();
    };
  }, []);

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

  // タイムライン上でクリックして時間移動
  const handleTimelineClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !duration || isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickTime = (x / rect.width) * duration;
    
    // 歌詞ブロックのクリック判定
    let clickedLyric = false;
    lyrics.forEach((line, index) => {
      const startX = (line.startTime / duration) * rect.width;
      const endX = (line.endTime / duration) * rect.width;
      
      if (y >= 10 && y <= rect.height - 10) {
        // 開始ハンドル
        if (x >= startX && x <= startX + 10) {
          handleLyricMouseDown(e, index, 'start');
          setSelectedLyricIndex(index);
          clickedLyric = true;
          return;
        }
        // 終了ハンドル
        if (x >= endX - 10 && x <= endX) {
          handleLyricMouseDown(e, index, 'end');
          setSelectedLyricIndex(index);
          clickedLyric = true;
          return;
        }
        // ブロック本体
        if (x >= startX && x <= endX) {
          handleLyricMouseDown(e, index, 'move');
          setSelectedLyricIndex(index);
          clickedLyric = true;
          return;
        }
      }
    });
    
    // 歌詞ブロック外をクリックした場合のみ時間移動
    if (!clickedLyric && audioRef.current) {
      audioRef.current.currentTime = clickTime;
      setCurrentTime(clickTime);
    }
  };

  // 歌詞ブロックのドラッグ調整
  const [isDragging, setIsDragging] = useState<{index: number, type: 'start' | 'end' | 'move'} | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState({start: 0, end: 0});

  const handleLyricMouseDown = (e: React.MouseEvent, index: number, type: 'start' | 'end' | 'move') => {
    e.preventDefault();
    setIsDragging({index, type});
    setDragStartX(e.clientX);
    setDragStartTime({
      start: lyrics[index].startTime,
      end: lyrics[index].endTime
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const deltaX = e.clientX - dragStartX;
    const rect = canvasRef.current.getBoundingClientRect();
    const deltaTime = (deltaX / rect.width) * duration;
    
    const newLyrics = [...lyrics];
    const index = isDragging.index;
    
    if (isDragging.type === 'start') {
      newLyrics[index].startTime = Math.max(0, Math.min(dragStartTime.start + deltaTime, newLyrics[index].endTime - 0.5));
    } else if (isDragging.type === 'end') {
      newLyrics[index].endTime = Math.min(duration, Math.max(dragStartTime.end + deltaTime, newLyrics[index].startTime + 0.5));
    } else {
      const duration = dragStartTime.end - dragStartTime.start;
      newLyrics[index].startTime = Math.max(0, dragStartTime.start + deltaTime);
      newLyrics[index].endTime = Math.min(duration, dragStartTime.end + deltaTime);
    }
    
    onLyricsChange(newLyrics);
  };


  // テキスト処理
  const handleTextSubmit = (lyricsText: string) => {
    try {
      const lines = lyricsText.split('\n').filter(line => line.trim().length > 0);
      const timedLyrics: LyricsLine[] = lines.map((line, index) => ({
        text: line.trim(),
        startTime: index * 3,
        endTime: (index + 1) * 3 - 0.5,
        confidence: 0.5
      }));
      
      onLyricsChange(timedLyrics);
      setShowTextInput(false);
    } catch (error) {
      console.error('歌詞処理エラー:', error);
      alert(`エラー: ${error.message}`);
    }
  };

  // 音声ファイル処理
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAudioFileChange?.(url);
      console.log('音声ファイルがアップロードされました:', file.name);
    }
  };

  // スタイル即座反映
  const updateStyleSetting = <K extends keyof StyleSettings>(
    key: K,
    value: StyleSettings[K]
  ) => {
    const newSettings = { ...styleSettings, [key]: value };
    onStyleChange(newSettings);
    console.log(`Updated ${key}:`, value);
  };

  // 波形描画（簡易版）
  const drawWaveform = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 簡易波形（ダミーデータ）
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const centerY = canvas.height / 2;
    
    for (let x = 0; x < canvas.width; x++) {
      const amplitude = Math.sin(x * 0.05) * Math.random() * 30;
      const y = centerY + amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 現在の再生位置
    if (duration > 0) {
      const playheadX = (currentTime / duration) * canvas.width;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();
    }

    // 歌詞ブロック
    lyrics.forEach((line, index) => {
      const startX = (line.startTime / duration) * canvas.width;
      const endX = (line.endTime / duration) * canvas.width;
      const width = endX - startX;
      
      // ブロック背景
      ctx.fillStyle = index === currentLyricIndex ? 
        'rgba(79, 70, 229, 0.6)' : 
        index === selectedLyricIndex ?
        'rgba(234, 179, 8, 0.6)' :
        'rgba(34, 197, 94, 0.4)';
      ctx.fillRect(startX, 10, width, canvas.height - 20);
      
      // ブロック境界
      ctx.strokeStyle = index === selectedLyricIndex ? '#eab308' : '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, 10, width, canvas.height - 20);
      
      // ドラッグハンドル（開始）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(startX, 10, 5, canvas.height - 20);
      
      // ドラッグハンドル（終了）
      ctx.fillRect(endX - 5, 10, 5, canvas.height - 20);
      
      // 歌詞テキスト
      ctx.fillStyle = 'white';
      ctx.font = '12px system-ui';
      const text = line.text.substring(0, Math.floor(width / 8));
      ctx.fillText(text, startX + 10, 25);
    });
  };

  useEffect(() => {
    drawWaveform();
  }, [currentTime, duration, lyrics, selectedLyricIndex]);


  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#0f0f0f',
    color: 'white',
    fontFamily: 'system-ui',
    position: 'relative',
  };

  const leftPanelStyle: React.CSSProperties = {
    width: '300px',
    borderRight: '1px solid #333',
    padding: '20px',
    paddingBottom: '150px',
    height: '100vh',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    scrollbarColor: '#4f46e5 #1a1a2e',
  };

  const mainAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    paddingBottom: '120px',
    boxSizing: 'border-box',
  };

  const previewStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    position: 'relative',
  };

  const timelineStyle: React.CSSProperties = {
    height: '200px',
    borderTop: '1px solid #333',
    padding: '20px',
  };

  const controlsStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100px',
    borderTop: '2px solid #333',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
    boxShadow: '0 -4px 10px rgba(0,0,0,0.5)',
  };

  return (
    <div style={containerStyle}>
      {/* 音声要素 */}
      {audioFile && (
        <audio
          ref={audioRef}
          src={audioFile}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* 左パネル：リアルタイムスタイル調整 */}
      <div style={leftPanelStyle}>
        <h3 style={{ margin: '0 0 20px 0' }}>🎨 リアルタイム調整</h3>

        {/* スタイルプリセット */}
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4f46e5' }}>
            ✨ スタイルプリセット
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* テスト用：太字確認ボタン */}
            <button
              onClick={() => {
                updateStyleSetting('fontSize', 40);
                updateStyleSetting('fontWeight', '900');
                updateStyleSetting('fontColor', '#FFFFFF');
                updateStyleSetting('strokeColor', '#000000');
                updateStyleSetting('strokeWidth', 0);
                updateStyleSetting('fontFamily', "system-ui, sans-serif");
                updateStyleSetting('position', 'center');
                updateStyleSetting('glowEffect', 'none' as any);
              }}
              style={{
                padding: '8px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🔥 超太字テスト
            </button>
            <button
              onClick={() => {
                updateStyleSetting('fontSize', 46);
                updateStyleSetting('fontWeight', 'bold');
                updateStyleSetting('fontColor', '#FFFFFF');
                updateStyleSetting('strokeColor', '#000000');
                updateStyleSetting('strokeWidth', 3);
                updateStyleSetting('fontFamily', "'A-OTF Ryumin Pr6N M', 'リュウミン M-KL', 'Hiragino Mincho ProN', 'ヒラギノ明朝 ProN W3', 'Yu Mincho', '游明朝', 'Shippori Mincho', 'しっぽり明朝', serif");
                updateStyleSetting('position', 'bottom');
                updateStyleSetting('glowEffect', 'none' as any);
                updateStyleSetting('textWrap', 'nowrap' as any);
              }}
              style={{
                padding: '8px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🎌 アニメ明朝
            </button>
            <button
              onClick={() => {
                updateStyleSetting('fontSize', 36);
                updateStyleSetting('fontWeight', '800');
                updateStyleSetting('fontColor', '#FFFF00');
                updateStyleSetting('strokeColor', '#000000');
                updateStyleSetting('strokeWidth', 2);
                updateStyleSetting('fontFamily', "'M PLUS Rounded 1c', sans-serif");
                updateStyleSetting('position', 'bottom');
                updateStyleSetting('glowEffect', 'none' as any);
              }}
              style={{
                padding: '8px',
                backgroundColor: '#eab308',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              📺 バラエティ
            </button>
            <button
              onClick={() => {
                updateStyleSetting('fontSize', 42);
                updateStyleSetting('fontWeight', 'bold');
                updateStyleSetting('fontColor', '#FFFFFF');
                updateStyleSetting('strokeColor', '#FF1493');
                updateStyleSetting('strokeWidth', 2);
                updateStyleSetting('fontFamily', "'Kiwi Maru', serif");
                updateStyleSetting('position', 'center');
                updateStyleSetting('glowEffect', 'neon' as any);
                updateStyleSetting('glowColor', '#FF69B4');
              }}
              style={{
                padding: '8px',
                backgroundColor: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🎤 カラオケ
            </button>
            <button
              onClick={() => {
                updateStyleSetting('fontSize', 32);
                updateStyleSetting('fontWeight', 'normal');
                updateStyleSetting('fontColor', '#FFFFFF');
                updateStyleSetting('strokeColor', '#000000');
                updateStyleSetting('strokeWidth', 1);
                updateStyleSetting('fontFamily', "'Shippori Mincho', 'しっぽり明朝', serif");
                updateStyleSetting('position', 'bottom');
                updateStyleSetting('glowEffect', 'none' as any);
              }}
              style={{
                padding: '8px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              📖 字幕
            </button>
          </div>
        </div>

        {/* 初期設定 */}
        {(!lyrics.length || showTextInput) && (
          <div style={{
            backgroundColor: '#1a1a2e',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #4f46e5',
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#4f46e5' }}>
              📝 歌詞を入力
            </h4>
            <TextInputUploader onTextSubmit={handleTextSubmit} />
          </div>
        )}

        {/* 音声ファイルアップロード */}
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>🎵 音声ファイル</h4>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: audioFile ? '#059669' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {audioFile ? '✅ 音声ファイル選択済み' : '📁 MP3ファイルを選択'}
          </button>
          
          {lyrics.length > 0 && (
            <button
              onClick={() => setShowTextInput(true)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '8px',
              }}
            >
              📝 歌詞を再編集
            </button>
          )}
        </div>
        
        {/* 選択中の歌詞 */}
        {selectedLyricIndex !== null && lyrics[selectedLyricIndex] && (
          <div style={{
            backgroundColor: '#1a1a2e',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #eab308',
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#eab308' }}>
              選択中: 行{selectedLyricIndex + 1}
            </h4>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#ccc', marginBottom: '5px' }}>歌詞テキスト:</label>
              <input
                type="text"
                value={lyrics[selectedLyricIndex]?.text || ''}
                onChange={(e) => {
                  const newLyrics = [...lyrics];
                  if (newLyrics[selectedLyricIndex]) {
                    newLyrics[selectedLyricIndex].text = e.target.value;
                    onLyricsChange(newLyrics);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#ccc', marginBottom: '3px' }}>開始時間(秒):</label>
                <input
                  type="number"
                  value={lyrics[selectedLyricIndex]?.startTime.toFixed(1) || '0.0'}
                  onChange={(e) => {
                    const newLyrics = [...lyrics];
                    if (newLyrics[selectedLyricIndex]) {
                      newLyrics[selectedLyricIndex].startTime = Math.max(0, parseFloat(e.target.value) || 0);
                      onLyricsChange(newLyrics);
                    }
                  }}
                  step="0.1"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    fontSize: '12px',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#ccc', marginBottom: '3px' }}>終了時間(秒):</label>
                <input
                  type="number"
                  value={lyrics[selectedLyricIndex]?.endTime.toFixed(1) || '0.0'}
                  onChange={(e) => {
                    const newLyrics = [...lyrics];
                    if (newLyrics[selectedLyricIndex]) {
                      newLyrics[selectedLyricIndex].endTime = Math.max(newLyrics[selectedLyricIndex].startTime + 0.1, parseFloat(e.target.value) || 0);
                      onLyricsChange(newLyrics);
                    }
                  }}
                  step="0.1"
                  min="0.1"
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '5px' }}>
              <button
                onClick={() => {
                  if (audioRef.current && lyrics[selectedLyricIndex]) {
                    audioRef.current.currentTime = lyrics[selectedLyricIndex].startTime;
                    setCurrentTime(lyrics[selectedLyricIndex].startTime);
                  }
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ▶️ 開始位置へ
              </button>
              <button
                onClick={() => {
                  if (audioRef.current && lyrics[selectedLyricIndex]) {
                    audioRef.current.currentTime = lyrics[selectedLyricIndex].endTime;
                    setCurrentTime(lyrics[selectedLyricIndex].endTime);
                  }
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ⏹️ 終了位置へ
              </button>
            </div>
          </div>
        )}

        {/* フォントサイズ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            フォントサイズ: {styleSettings.fontSize}px
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={() => updateStyleSetting('fontSize', Math.max(12, styleSettings.fontSize - 2))}
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>
            <input
              type="range"
              min="12"
              max="200"
              value={styleSettings.fontSize}
              onChange={(e) => updateStyleSetting('fontSize', parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => updateStyleSetting('fontSize', Math.min(200, styleSettings.fontSize + 2))}
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ＋
            </button>
          </div>
          <input
            type="number"
            min="12"
            max="200"
            value={styleSettings.fontSize}
            onChange={(e) => updateStyleSetting('fontSize', parseInt(e.target.value))}
            style={{
              width: '60px',
              padding: '3px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '3px',
            }}
          />
        </div>

        {/* フォントファミリー */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            フォント
          </label>
          <select
            value={styleSettings.fontFamily}
            onChange={(e) => updateStyleSetting('fontFamily', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            <option value="'Shippori Mincho', 'しっぽり明朝', serif">しっぽり明朝</option>
            <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
            <option value="'M PLUS Rounded 1c', sans-serif">M PLUS Rounded</option>
            <option value="'Sawarabi Gothic', sans-serif">さわらびゴシック</option>
            <option value="'Kosugi Maru', sans-serif">小杉丸ゴシック</option>
            <option value="'Zen Maru Gothic', sans-serif">Zen丸ゴシック</option>
            <option value="'Kiwi Maru', serif">キウイ丸</option>
            <option value="'Hachi Maru Pop', cursive">はち丸ポップ</option>
            <option value="'Dela Gothic One', cursive">Dela Gothic One</option>
            <option value="'RocknRoll One', sans-serif">RocknRoll One</option>
            <option value="'Reggae One', cursive">レゲエ</option>
            <option value="'Stick', sans-serif">スティック</option>
            <option value="'DotGothic16', sans-serif">ドットゴシック</option>
            <option value="'Yuji Syuku', serif">佑字肅</option>
            <option value="'Kaisei Decol', serif">解星デコール</option>
            <option value="'A-OTF Ryumin Pr6N M', 'リュウミン M-KL', 'Ryumin Medium', serif">リュウミン M</option>
            <option value="'A-OTF Ryumin Pr6N H', 'リュウミン H-KL', 'Ryumin Heavy', serif">リュウミン H</option>
            <option value="'A-OTF Gothic BBB Pr6N M', 'ゴシックBBB Medium', sans-serif">ゴシックBBB M</option>
            <option value="'A-OTF Shin Go Pr6N M', '新ゴ M', sans-serif">新ゴ M</option>
            <option value="'A-OTF Shin Go Pr6N B', '新ゴ B', sans-serif">新ゴ B</option>
            <option value="'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', sans-serif">ヒラギノ角ゴ ProN</option>
            <option value="'Hiragino Mincho ProN', 'ヒラギノ明朝 ProN W3', serif">ヒラギノ明朝 ProN</option>
            <option value="'Yu Gothic', '游ゴシック', sans-serif">游ゴシック</option>
            <option value="'Yu Mincho', '游明朝', serif">游明朝</option>
            <option value="system-ui, sans-serif">システムフォント</option>
          </select>
        </div>

        {/* フォント太さ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            フォント太さ
          </label>
          <select
            value={styleSettings.fontWeight || 'bold'}
            onChange={(e) => updateStyleSetting('fontWeight', e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            <option value="100">100 - 極細</option>
            <option value="200">200 - 細</option>
            <option value="300">300 - 薄</option>
            <option value="normal">400 - 標準</option>
            <option value="500">500 - 中太</option>
            <option value="600">600 - 太</option>
            <option value="bold">700 - 太字</option>
            <option value="800">800 - 極太</option>
            <option value="900">900 - 超極太</option>
          </select>
        </div>

        {/* 文字色 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            文字色
          </label>
          <input
            type="color"
            value={styleSettings.fontColor}
            onChange={(e) => updateStyleSetting('fontColor', e.target.value)}
            style={{ width: '100%', height: '40px', cursor: 'pointer' }}
          />
        </div>

        {/* ストローク（縁取り）設定 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            縁取り色
          </label>
          <input
            type="color"
            value={styleSettings.strokeColor}
            onChange={(e) => updateStyleSetting('strokeColor', e.target.value)}
            style={{ width: '100%', height: '40px', cursor: 'pointer' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            縁取り太さ: {styleSettings.strokeWidth.toFixed(1)}px
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => updateStyleSetting('strokeWidth', Math.max(0, styleSettings.strokeWidth - 0.1))}
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={styleSettings.strokeWidth}
              onChange={(e) => updateStyleSetting('strokeWidth', parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => updateStyleSetting('strokeWidth', Math.min(10, styleSettings.strokeWidth + 0.1))}
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ＋
            </button>
          </div>
        </div>

        {/* 位置 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            位置
          </label>
          <select
            value={styleSettings.position}
            onChange={(e) => updateStyleSetting('position', e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            <option value="bottom">下部</option>
            <option value="center">中央</option>
            <option value="top">上部</option>
          </select>
        </div>

        {/* Y軸オフセット */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            上下位置微調整: {styleSettings.yOffset || 0}px
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => updateStyleSetting('yOffset', (styleSettings.yOffset || 0) - 10)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ↑上へ
            </button>
            <input
              type="range"
              min="-200"
              max="200"
              value={styleSettings.yOffset || 0}
              onChange={(e) => updateStyleSetting('yOffset', parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => updateStyleSetting('yOffset', (styleSettings.yOffset || 0) + 10)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ↓下へ
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            <button
              onClick={() => updateStyleSetting('yOffset', 0)}
              style={{
                padding: '3px 8px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              リセット
            </button>
          </div>
        </div>

        {/* アニメーション */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            出現アニメーション
          </label>
          <select
            value={styleSettings.animationStyle}
            onChange={(e) => updateStyleSetting('animationStyle', e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            <option value="fade">フェードイン</option>
            <option value="slide">スライドイン</option>
            <option value="scale">ズームイン</option>
            <option value="bounce">バウンス</option>
            <option value="typewriter">タイプライター</option>
            <option value="blur">ブラーイン</option>
            <option value="rotate">回転</option>
            <option value="wave">ウェーブ</option>
          </select>
        </div>

        {/* アニメーション速度 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            アニメーション速度: {styleSettings.fadeSpeed || 0.5}秒
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={styleSettings.fadeSpeed || 0.5}
            onChange={(e) => updateStyleSetting('fadeSpeed', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999', marginTop: '3px' }}>
            <span>高速</span>
            <span>低速</span>
          </div>
        </div>

        {/* テキスト改行設定 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            長いテキストの表示
          </label>
          <select
            value={styleSettings.textWrap || 'nowrap'}
            onChange={(e) => updateStyleSetting('textWrap', e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            <option value="nowrap">1行で表示（はみ出る）</option>
            <option value="wrap">改行して表示</option>
            <option value="auto">自動調整</option>
          </select>
        </div>

        {/* 発光エフェクト */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            発光エフェクト
          </label>
          <select
            value={styleSettings.glowEffect || 'none'}
            onChange={(e) => updateStyleSetting('glowEffect', e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            <option value="none">なし</option>
            <option value="weak">弱い発光</option>
            <option value="soft">ソフト発光</option>
            <option value="strong">強い発光</option>
            <option value="neon">ネオン</option>
            <option value="pulse">パルス</option>
            <option value="rainbow">レインボー</option>
          </select>
        </div>

        {/* 発光色 */}
        {styleSettings.glowEffect && styleSettings.glowEffect !== 'none' && styleSettings.glowEffect !== 'rainbow' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              発光色
            </label>
            <input
              type="color"
              value={styleSettings.glowColor || '#ffffff'}
              onChange={(e) => updateStyleSetting('glowColor', e.target.value)}
              style={{ width: '100%', height: '40px', cursor: 'pointer' }}
            />
          </div>
        )}

        {/* 歌詞タイミング調整リスト */}
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4f46e5' }}>
            ⏰ 歌詞タイミング調整
          </h4>
          
          {/* 操作説明 */}
          <div style={{
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '11px',
            color: '#a5b4fc',
            lineHeight: '1.4'
          }}>
            <strong>📖 操作方法：</strong><br/>
            • ±ボタン：0.1秒刻みで時間調整（長押しで高速調整）<br/>
            • 🎯ボタン：その時間にジャンプして確認<br/>
            • ⏭️ボタン：次の歌詞の開始時間を自動設定（+3秒）<br/>
            • 青色：現在再生中 / 黄色：選択中
          </div>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {lyrics.map((line, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px',
                  backgroundColor: index === selectedLyricIndex ? 'rgba(234, 179, 8, 0.2)' : 
                                  index === currentLyricIndex ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  border: index === currentLyricIndex ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid transparent',
                }}
                onClick={() => setSelectedLyricIndex(index)}
              >
                <span style={{ width: '20px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
                  {index + 1}
                </span>
                <span style={{ flex: 1, fontSize: '11px', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: '60px' }}>
                  {line.text}
                </span>
                
                {/* 開始時間調整 */}
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const action = () => {
                      const newLyrics = [...lyrics];
                      newLyrics[index].startTime = Math.max(0, newLyrics[index].startTime - 0.1);
                      onLyricsChange(newLyrics);
                    };
                    handleMouseDown(action);
                  }}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#374151',
                    color: '#9ca3af',
                    border: '1px solid #4b5563',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    userSelect: 'none',
                  }}
                >
                  −
                </button>
                <span style={{ 
                  fontSize: '10px', 
                  color: index === currentLyricIndex ? '#60a5fa' : '#9ca3af',
                  fontWeight: index === currentLyricIndex ? 'bold' : 'normal',
                  minWidth: '28px',
                  textAlign: 'center'
                }}>
                  {line.startTime.toFixed(1)}
                </span>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const action = () => {
                      const newLyrics = [...lyrics];
                      newLyrics[index].startTime = Math.min(duration, newLyrics[index].startTime + 0.1);
                      onLyricsChange(newLyrics);
                    };
                    handleMouseDown(action);
                  }}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#374151',
                    color: '#9ca3af',
                    border: '1px solid #4b5563',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    userSelect: 'none',
                  }}
                >
                  +
                </button>
                
                <span style={{ fontSize: '8px', color: '#6b7280', margin: '0 2px' }}>-</span>
                
                {/* 終了時間調整 */}
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const action = () => {
                      const newLyrics = [...lyrics];
                      newLyrics[index].endTime = Math.max(newLyrics[index].startTime + 0.1, newLyrics[index].endTime - 0.1);
                      onLyricsChange(newLyrics);
                    };
                    handleMouseDown(action);
                  }}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#374151',
                    color: '#9ca3af',
                    border: '1px solid #4b5563',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    userSelect: 'none',
                  }}
                >
                  −
                </button>
                <span style={{ 
                  fontSize: '10px', 
                  color: index === currentLyricIndex ? '#60a5fa' : '#9ca3af',
                  fontWeight: index === currentLyricIndex ? 'bold' : 'normal',
                  minWidth: '28px',
                  textAlign: 'center'
                }}>
                  {line.endTime.toFixed(1)}
                </span>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const action = () => {
                      const newLyrics = [...lyrics];
                      newLyrics[index].endTime = Math.min(duration, newLyrics[index].endTime + 0.1);
                      onLyricsChange(newLyrics);
                    };
                    handleMouseDown(action);
                  }}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#374151',
                    color: '#9ca3af',
                    border: '1px solid #4b5563',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    userSelect: 'none',
                  }}
                >
                  +
                </button>
                
                {/* ジャンプボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (audioRef.current) {
                      audioRef.current.currentTime = line.startTime;
                      setCurrentTime(line.startTime);
                    }
                  }}
                  style={{
                    width: '20px',
                    height: '18px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    marginLeft: '2px',
                  }}
                  title={`${line.startTime.toFixed(1)}秒にジャンプ`}
                >
                  🎯
                </button>
                
                {/* 次の歌詞への自動設定ボタン */}
                {index < lyrics.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newLyrics = [...lyrics];
                      // 現在の行の終了時間 + 0.1秒を次の行の開始時間に設定
                      newLyrics[index + 1].startTime = Math.min(duration, newLyrics[index].endTime + 0.1);
                      // 次の行の終了時間を開始時間 + 3秒に設定
                      newLyrics[index + 1].endTime = Math.min(duration, newLyrics[index + 1].startTime + 3);
                      onLyricsChange(newLyrics);
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: '1px solid #065f46',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      marginLeft: '2px',
                    }}
                    title={`次の歌詞の開始を${(line.endTime + 0.1).toFixed(1)}秒に設定`}
                  >
                    ⏭️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* スクロールテスト用コンテンツ */}
        <div style={{
          backgroundColor: '#2a2a3e',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #4f46e5'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4f46e5', fontSize: '14px' }}>
            📋 スクロールテスト
          </h4>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            <div>✅ この部分が見えればスクロール成功！</div>
            <div>現在時間: {currentTime.toFixed(1)}秒</div>
            <div>歌詞行数: {lyrics.length}</div>
            <div>音声ファイル: {audioFile ? '✅ 読み込み済み' : '❌ 未選択'}</div>
            <div>マウスホイールでスクロールしてください ↕️</div>
          </div>
        </div>

        {/* 追加のスクロールテスト項目 */}
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            backgroundColor: '#1e1e2e',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '10px',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '12px', color: '#999' }}>
              スクロールテスト項目 {i}
            </div>
          </div>
        ))}
        
        {/* スクロール用の下部余白 */}
        <div style={{ height: '80px', flexShrink: 0 }}></div>
      </div>

      {/* メインエリア */}
      <div style={mainAreaStyle}>
        {/* プレビューエリア */}
        <div style={previewStyle}>
          {currentLyricIndex >= 0 && (
            <div
              key={currentLyricIndex}
              style={{
                fontSize: `${styleSettings.fontSize}px`,
                fontFamily: styleSettings.fontFamily,
                fontWeight: styleSettings.fontWeight || 'bold',
                color: styleSettings.fontColor,
                textAlign: 'center',
                // strokeWidthが0の時はWebkitTextStrokeを適用しない（太字効果を維持）
                ...(styleSettings.strokeWidth > 0 ? {
                  WebkitTextStroke: `${styleSettings.strokeWidth}px ${styleSettings.strokeColor}`,
                  WebkitTextFillColor: styleSettings.fontColor,
                } : {}),
                lineHeight: 1.2,
                maxWidth: styleSettings.textWrap === 'nowrap' ? 'none' : '90%',
                whiteSpace: styleSettings.textWrap === 'wrap' ? 'normal' : 
                           styleSettings.textWrap === 'auto' ? 'pre-wrap' : 'nowrap',
                overflow: 'visible',
                wordBreak: styleSettings.textWrap === 'wrap' ? 'break-word' : 'normal',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                ...(styleSettings.position === 'bottom' ? {
                  bottom: `${100 + (styleSettings.yOffset || 0)}px`
                } : styleSettings.position === 'top' ? {
                  top: `${100 + (styleSettings.yOffset || 0)}px`
                } : {
                  top: '50%',
                  transform: `translate(-50%, calc(-50% + ${styleSettings.yOffset || 0}px))`
                }),
                // アニメーション効果
                ...(() => {
                  const currentLine = lyrics[currentLyricIndex];
                  const timeSinceStart = currentTime - currentLine.startTime;
                  const timeUntilEnd = currentLine.endTime - currentTime;
                  const animationDuration = styleSettings.fadeSpeed || 0.5;
                  
                  // フェードイン・フェードアウトの計算
                  let opacity = 1;
                  let transform = 'translateX(-50%)';
                  let scale = 1;
                  
                  if (styleSettings.animationStyle === 'fade') {
                    if (timeSinceStart < animationDuration) {
                      opacity = timeSinceStart / animationDuration;
                    } else if (timeUntilEnd < animationDuration) {
                      opacity = timeUntilEnd / animationDuration;
                    }
                  } else if (styleSettings.animationStyle === 'scale') {
                    if (timeSinceStart < animationDuration) {
                      const progress = timeSinceStart / animationDuration;
                      scale = 0.5 + (progress * 0.5);
                      opacity = progress;
                    } else if (timeUntilEnd < animationDuration) {
                      const progress = timeUntilEnd / animationDuration;
                      scale = 0.5 + (progress * 0.5);
                      opacity = progress;
                    }
                  } else if (styleSettings.animationStyle === 'slide') {
                    if (timeSinceStart < animationDuration) {
                      const progress = timeSinceStart / animationDuration;
                      const slideX = -50 + (progress * (-50));
                      transform = `translateX(${slideX}%)`;
                      opacity = progress;
                    } else if (timeUntilEnd < animationDuration) {
                      opacity = timeUntilEnd / animationDuration;
                    }
                  }
                  
                  return {
                    opacity: Math.max(0, Math.min(1, opacity)),
                    transform: styleSettings.position === 'center' ? 
                      `translate(-50%, calc(-50% + ${styleSettings.yOffset || 0}px)) scale(${scale})` :
                      `${transform} scale(${scale})`,
                    transition: 'none',
                  };
                })(),
                // 発光エフェクト＋アニメ風影
                ...(styleSettings.glowEffect === 'weak' ? {
                  textShadow: `
                    1px 1px 0px rgba(0,0,0,0.7),
                    0 0 5px ${styleSettings.glowColor || '#ffffff'}`
                } : styleSettings.glowEffect === 'soft' ? {
                  textShadow: `
                    2px 2px 0px rgba(0,0,0,0.8),
                    4px 4px 8px rgba(0,0,0,0.5),
                    0 0 10px ${styleSettings.glowColor || '#ffffff'},
                    0 0 20px ${styleSettings.glowColor || '#ffffff'}`
                } : styleSettings.glowEffect === 'strong' ? {
                  textShadow: `
                    2px 2px 0px rgba(0,0,0,0.8),
                    0 0 20px ${styleSettings.glowColor || '#ffffff'},
                    0 0 40px ${styleSettings.glowColor || '#ffffff'},
                    0 0 60px ${styleSettings.glowColor || '#ffffff'}`
                } : styleSettings.glowEffect === 'neon' ? {
                  textShadow: `
                    0 0 10px ${styleSettings.glowColor || '#ffffff'},
                    0 0 20px ${styleSettings.glowColor || '#ffffff'},
                    0 0 30px ${styleSettings.glowColor || '#ffffff'},
                    0 0 40px ${styleSettings.glowColor || '#ffffff'}`
                } : styleSettings.glowEffect === 'pulse' ? {
                  textShadow: `2px 2px 0px rgba(0,0,0,0.8), 0 0 20px ${styleSettings.glowColor || '#ffffff'}`,
                  animation: 'pulse 1.5s ease-in-out infinite'
                } : styleSettings.glowEffect === 'rainbow' ? {
                  animation: 'rainbow 3s linear infinite'
                } : {
                  // 発光エフェクトがない場合：基本影 + フォント太さ強調
                  textShadow: `2px 2px 4px rgba(0,0,0,0.8), 4px 4px 8px rgba(0,0,0,0.5)${
                    (styleSettings.fontWeight === 'bold' || parseInt(styleSettings.fontWeight || '400') >= 700) &&
                    styleSettings.strokeWidth <= 0.5
                      ? ', 1px 0 0 currentColor, 0 1px 0 currentColor, -1px 0 0 currentColor, 0 -1px 0 currentColor' 
                      : ''
                  }`
                })
              }}
            >
              {lyrics[currentLyricIndex].text}
            </div>
          )}
          
          {/* アニメーション用のスタイル */}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; filter: brightness(1); }
              50% { opacity: 0.8; filter: brightness(1.3); }
            }
            
            @keyframes rainbow {
              0% { filter: hue-rotate(0deg); text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000; }
              33% { filter: hue-rotate(120deg); text-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00; }
              66% { filter: hue-rotate(240deg); text-shadow: 0 0 20px #0000ff, 0 0 40px #0000ff; }
              100% { filter: hue-rotate(360deg); text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000; }
            }

            /* スクロールバーのスタイリング */
            *::-webkit-scrollbar {
              width: 12px;
            }
            
            *::-webkit-scrollbar-track {
              background: #1a1a1a;
              border-radius: 6px;
            }
            
            *::-webkit-scrollbar-thumb {
              background: #4f46e5;
              border-radius: 6px;
              border: 2px solid #1a1a1a;
            }
            
            *::-webkit-scrollbar-thumb:hover {
              background: #6366f1;
            }

            /* スクロール可能なコンテンツ */
            .scrollable-content {
              overflow-y: scroll !important;
              overflow-x: hidden !important;
              height: 100% !important;
              scrollbar-width: auto !important;
            }

            /* スクロールバーを常に表示 */
            .scrollable-content::-webkit-scrollbar {
              width: 14px !important;
              background: #1a1a1a !important;
            }
            
            .scrollable-content::-webkit-scrollbar-track {
              background: #1a1a1a !important;
              border-radius: 7px !important;
            }
            
            .scrollable-content::-webkit-scrollbar-thumb {
              background: #4f46e5 !important;
              border-radius: 7px !important;
              border: 2px solid #1a1a1a !important;
              min-height: 40px !important;
            }
            
            .scrollable-content::-webkit-scrollbar-thumb:hover {
              background: #6366f1 !important;
            }

            /* Firefox用のスクロールバー */
            .scrollable-content {
              scrollbar-width: auto !important;
              scrollbar-color: #4f46e5 #1a1a1a !important;
            }

            /* 強制スクロール */
            .force-scroll {
              overflow-y: scroll !important;
              overflow-x: hidden !important;
              -webkit-overflow-scrolling: touch !important;
            }
          `}</style>
        </div>

        {/* タイムライン */}
        <div style={timelineStyle}>
          <h3 style={{ margin: '0 0 10px 0' }}>🎵 波形タイムライン</h3>
          <canvas
            ref={canvasRef}
            width={800}
            height={120}
            style={{
              width: '100%',
              height: '120px',
              border: '1px solid #333',
              cursor: 'pointer',
            }}
            onClick={handleTimelineClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#ccc' }}>
            💡 クリックで時間移動 | 歌詞ブロックをドラッグでタイミング調整 | 端をドラッグで開始/終了時間を個別調整
          </p>
        </div>

        {/* 再生コントロール */}
        <div style={controlsStyle}>
          <button
            onClick={togglePlay}
            disabled={!audioFile}
            style={{
              backgroundColor: audioFile ? '#4f46e5' : '#9333ea',
              color: 'white',
              border: '2px solid ' + (audioFile ? '#6366f1' : '#a855f7'),
              borderRadius: '8px',
              padding: '15px 30px',
              cursor: audioFile ? 'pointer' : 'not-allowed',
              fontSize: '20px',
              minWidth: '120px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (audioFile) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
            }}
          >
            {isPlaying ? '⏸️ 停止' : '▶️ 再生'}
          </button>

          <div style={{ flex: 1, fontSize: '14px', color: 'white' }}>
            <div>現在: {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</div>
            <div>行: {currentLyricIndex >= 0 ? currentLyricIndex + 1 : '-'} / {lyrics.length}</div>
          </div>

          <button
            onClick={() => {
              // 歌詞動画の書き出し手順を案内
              const message = `📹 歌詞動画の書き出し手順：

1. Remotion Studio左上の「Composition」を変更：
   • 横動画（YouTube）: "LyricsVideoYouTube" を選択
   • 縦動画（TikTok/Instagram）: "LyricsVideoVertical" を選択

2. Remotion Studio右上の「Render」ボタンをクリック

3. 動画ファイル（MP4）がダウンロードされます

注意: "WaveformEditor"は編集専用です。必ず上記のコンポジションを選択してください。`;
              
              alert(message);
              
              // 5秒後にコンポジション選択を強調表示
              setTimeout(() => {
                const compositionSelector = document.querySelector('[data-testid="composition-selector"]');
                if (compositionSelector) {
                  compositionSelector.scrollIntoView({ behavior: 'smooth' });
                  (compositionSelector as HTMLElement).style.border = '3px solid #10b981';
                  setTimeout(() => {
                    (compositionSelector as HTMLElement).style.border = '';
                  }, 3000);
                }
              }, 1000);
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: '2px solid #34d399',
              borderRadius: '8px',
              padding: '15px 25px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
              minWidth: '180px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.4)';
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
              e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            🎥 動画を書き出し
          </button>

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (audioRef.current) {
                audioRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }}
            style={{
              flex: 2,
              height: '5px',
            }}
          />
        </div>
      </div>
    </div>
  );
};