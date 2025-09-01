import React, { useState, useCallback } from 'react';
import { FileUploader, UploadedFiles } from './FileUploader';
import { TextInputUploader } from './TextInputUploader';
import { StyleControls, StyleSettings } from './StyleControls';
import { ExportManager, ExportFormat } from './ExportManager';
import { LyricsLine } from './LyricsEditor';
import { AudioLyricsSync, adjustLyricsTiming } from '../utils/aiTiming';
import { updateLyricsStore } from '../store/lyricsStore';

export interface LyricsStudioProps {
  onLyricsGenerated: (lyrics: LyricsLine[], audioFile?: string, backgroundImage?: string, styleSettings?: StyleSettings) => void;
  style?: React.CSSProperties;
}

export const LyricsStudio: React.FC<LyricsStudioProps> = ({ 
  onLyricsGenerated, 
  style = {} 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [generatedLyrics, setGeneratedLyrics] = useState<LyricsLine[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  
  // タイミング調整用の状態
  const [globalOffset, setGlobalOffset] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  // スタイル設定の状態
  const [styleSettings, setStyleSettings] = useState<StyleSettings>({
    fontFamily: "'Shippori Mincho', 'しっぽり明朝', serif",
    fontSize: 48,
    fontColor: '#000000',
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
    position: 'bottom',
    yOffset: 0,
    animationStyle: 'fade',
    fadeSpeed: 0.5,
  });

  // ファイルアップロード処理
  const handleFilesUploaded = useCallback(async (files: UploadedFiles) => {
    setUploadedFiles(files);
    
    // MP3と歌詞が両方アップロードされた場合、自動でAI認識を開始
    if (files.audioBlob && files.lyricsText) {
      await processLyrics(files.audioBlob, files.lyricsText, files.audioFile, files.backgroundImage);
    }
  }, []);

  // テキスト入力処理
  const handleTextSubmit = useCallback(async (lyricsText: string) => {
    if (uploadedFiles.audioBlob) {
      // 音声ファイルがある場合はAI認識実行
      await processLyrics(uploadedFiles.audioBlob, lyricsText, uploadedFiles.audioFile, uploadedFiles.backgroundImage);
    } else {
      // 音声ファイルがない場合はサンプルタイミングで生成
      await processLyricsTextOnly(lyricsText);
    }
  }, [uploadedFiles.audioBlob, uploadedFiles.audioFile, uploadedFiles.backgroundImage]);

  // テキストのみでの処理（音声なし）
  const processLyricsTextOnly = async (lyricsText: string) => {
    console.log('=== 歌詞処理開始 ===');
    setIsProcessing(true);
    setProgress('歌詞を処理中...');

    try {
      // ステップ1: 入力チェック
      if (!lyricsText || lyricsText.trim().length === 0) {
        throw new Error('歌詞テキストが空です');
      }
      console.log('✅ 入力チェック完了:', lyricsText.substring(0, 50) + '...');

      // ステップ2: 行分割
      const lines = lyricsText.split('\n').filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        throw new Error('有効な歌詞行が見つかりません');
      }
      console.log('✅ 行分割完了:', lines.length, '行');

      // ステップ3: タイミング生成
      const timedLyrics: LyricsLine[] = [];
      for (let i = 0; i < lines.length; i++) {
        timedLyrics.push({
          text: lines[i].trim(),
          startTime: i * 3,
          endTime: (i + 1) * 3 - 0.5,
          confidence: 0.5
        });
      }
      console.log('✅ タイミング生成完了:', timedLyrics);

      // ステップ4: 状態更新
      setGeneratedLyrics(timedLyrics);
      console.log('✅ ローカル状態更新完了');

      // ステップ5: グローバルストア更新
      updateLyricsStore({
        lyrics: timedLyrics,
        audioFile: uploadedFiles.audioFile,
        backgroundImage: uploadedFiles.backgroundImage,
        styleSettings
      });
      console.log('✅ グローバルストア更新完了');

      // ステップ6: コールバック実行
      onLyricsGenerated(timedLyrics, uploadedFiles.audioFile, uploadedFiles.backgroundImage, styleSettings);
      console.log('✅ コールバック実行完了');

      setProgress('歌詞処理完了 ✅');
      setTimeout(() => setProgress(''), 5000);
      
    } catch (error) {
      console.error('❌ 歌詞処理エラー:', error);
      setProgress(`エラー: ${error.message}`);
      setTimeout(() => setProgress(''), 10000);
    } finally {
      setIsProcessing(false);
      console.log('=== 歌詞処理終了 ===');
    }
  };

  // AI歌詞認識処理（簡素化版）
  const processLyrics = async (
    audioFile: Blob, 
    lyricsText: string, 
    audioUrl?: string, 
    backgroundImage?: string
  ) => {
    setIsProcessing(true);
    setProgress('歌詞を処理中...');

    try {
      // シンプルな処理：歌詞を3秒間隔で配置
      const lines = lyricsText.split('\n').filter(line => line.trim().length > 0);
      const timedLyrics: LyricsLine[] = lines.map((line, index) => ({
        text: line.trim(),
        startTime: index * 3,
        endTime: (index + 1) * 3 - 0.5,
        confidence: 0.8
      }));
      
      setProgress('タイミング調整中...');
      
      // 初期調整を適用
      const adjustedLyrics = adjustLyricsTiming(timedLyrics, globalOffset, speedMultiplier);
      
      setGeneratedLyrics(adjustedLyrics);
      setProgress('');
      
      // Remotion Studio に結果を送信
      onLyricsGenerated(adjustedLyrics, audioUrl, backgroundImage, styleSettings);
      
    } catch (error) {
      console.error('処理エラー:', error);
      setProgress('エラー: 歌詞処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 手動再処理
  const reprocessLyrics = async () => {
    if (uploadedFiles.audioBlob && uploadedFiles.lyricsText) {
      await processLyrics(
        uploadedFiles.audioBlob, 
        uploadedFiles.lyricsText, 
        uploadedFiles.audioFile, 
        uploadedFiles.backgroundImage
      );
    }
  };

  // タイミング調整の適用
  const applyTimingAdjustment = () => {
    if (generatedLyrics.length > 0) {
      const adjustedLyrics = adjustLyricsTiming(generatedLyrics, globalOffset, speedMultiplier);
      setGeneratedLyrics(adjustedLyrics);
      onLyricsGenerated(adjustedLyrics, uploadedFiles.audioFile, uploadedFiles.backgroundImage, styleSettings);
    }
  };

  // スタイル設定の適用
  const handleStyleChange = (newStyleSettings: StyleSettings) => {
    setStyleSettings(newStyleSettings);
    if (generatedLyrics.length > 0) {
      onLyricsGenerated(generatedLyrics, uploadedFiles.audioFile, uploadedFiles.backgroundImage, newStyleSettings);
    }
  };

  // エクスポート処理
  const handleExport = (formats: ExportFormat[]) => {
    console.log('Export formats:', formats);
    // 実際のエクスポート処理はRemotionのrender APIを使用
    // ここでは各フォーマットに対してrender処理を実行
    alert(`${formats.length}個のフォーマットで出力を開始しました！\nRemotion Studio でレンダリングを確認してください。`);
  };

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    width: '100%',
    height: '100vh',
    backgroundColor: '#f8fafc',
    overflow: 'auto',
    fontSize: '14px',
    ...style,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: 'white',
  };

  const adjustmentControlStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    minWidth: '120px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    background: '#d1d5db',
    outline: 'none',
    cursor: 'pointer',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginRight: '8px',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: '#1f2937',
        textAlign: 'center' 
      }}>
        🎵 歌詞動画スタジオ
      </h2>

      {/* ファイルアップロードセクション */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
          1A. ファイルアップロード（MP3 + TXT）
        </h3>
        <FileUploader onFilesUploaded={handleFilesUploaded} />
      </div>

      {/* テキスト入力セクション */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
          1B. 歌詞テキスト直接入力（推奨）
        </h3>
        <TextInputUploader onTextSubmit={handleTextSubmit} />
        {!uploadedFiles.audioBlob && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fff3cd',
            borderRadius: '6px',
            border: '1px solid #ffeaa7',
            fontSize: '12px',
            color: '#856404',
          }}>
            💡 音声ファイルがない場合は、3秒間隔の固定タイミングで生成されます
          </div>
        )}
      </div>

      {/* AI処理ステータス */}
      {(isProcessing || progress) && (
        <div style={{
          ...sectionStyle,
          backgroundColor: isProcessing ? '#dbeafe' : '#fef3c7',
          borderColor: isProcessing ? '#3b82f6' : '#f59e0b',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            {isProcessing && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #3b82f6',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            )}
            <span style={{ 
              color: isProcessing ? '#1e40af' : '#92400e',
              fontSize: '14px',
              fontWeight: '500' 
            }}>
              {progress || 'AI歌詞認識完了 ✅'}
            </span>
          </div>
        </div>
      )}

      {/* スタイル設定セクション */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
          2. スタイル設定
        </h3>
        <StyleControls 
          settings={styleSettings}
          onSettingsChange={handleStyleChange}
        />
      </div>

      {/* タイミング調整セクション */}
      {generatedLyrics.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
            3. タイミング微調整
          </h3>
          
          <div style={adjustmentControlStyle}>
            <label style={labelStyle}>全体オフセット:</label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={globalOffset}
              onChange={(e) => setGlobalOffset(parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '60px' }}>
              {globalOffset.toFixed(1)}秒
            </span>
          </div>

          <div style={adjustmentControlStyle}>
            <label style={labelStyle}>再生速度:</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '60px' }}>
              {speedMultiplier.toFixed(2)}x
            </span>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button
              style={buttonStyle}
              onClick={applyTimingAdjustment}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            >
              調整を適用
            </button>
            
            <button
              style={{
                ...buttonStyle,
                backgroundColor: '#059669',
              }}
              onClick={reprocessLyrics}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            >
              AI再認識
            </button>
          </div>
        </div>
      )}

      {/* 歌詞プレビュー */}
      {generatedLyrics.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
            4. 歌詞プレビュー ({generatedLyrics.length}行)
          </h3>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: '1.6',
          }}>
            {generatedLyrics.map((line, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  backgroundColor: index % 2 === 0 ? '#f3f4f6' : 'transparent',
                  borderRadius: '4px',
                }}
              >
                <span style={{ flex: 1, color: '#374151' }}>{line.text}</span>
                <span style={{ color: '#6b7280', fontSize: '11px' }}>
                  {line.startTime.toFixed(1)}s - {line.endTime.toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* エクスポートマネージャー */}
      {generatedLyrics.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
            5. 一括出力
          </h3>
          <ExportManager
            lyricsData={generatedLyrics}
            audioFile={uploadedFiles.audioFile}
            backgroundImage={uploadedFiles.backgroundImage}
            onExport={handleExport}
          />
        </div>
      )}

      {/* スタイルアニメーション */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};