import React, { useRef, useState, useCallback } from 'react';

export interface UploadedFiles {
  audioFile?: string;
  lyricsFile?: string;
  backgroundImage?: string;
  audioBlob?: Blob;
  lyricsText?: string;
}

export interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFiles) => void;
  style?: React.CSSProperties;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesUploaded, 
  style = {} 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ドラッグ&ドロップハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  // ファイル選択ハンドラー
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  }, []);

  // ファイル処理
  const processFiles = async (files: File[]) => {
    const newFiles: UploadedFiles = { ...uploadedFiles };

    for (const file of files) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      // 音声ファイル（MP3, WAV, M4A）
      if (fileType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.m4a')) {
        const url = URL.createObjectURL(file);
        newFiles.audioFile = url;
        newFiles.audioBlob = file;
      }
      // 歌詞ファイル（TXT, SRT, LRC）
      else if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.srt') || fileName.endsWith('.lrc')) {
        const text = await file.text();
        newFiles.lyricsFile = fileName;
        newFiles.lyricsText = text;
      }
      // 画像ファイル（背景用）
      else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        const url = URL.createObjectURL(file);
        newFiles.backgroundImage = url;
      }
    }

    setUploadedFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  // ファイルをクリア
  const clearFiles = () => {
    if (uploadedFiles.audioFile) URL.revokeObjectURL(uploadedFiles.audioFile);
    if (uploadedFiles.backgroundImage) URL.revokeObjectURL(uploadedFiles.backgroundImage);
    
    const emptyFiles: UploadedFiles = {};
    setUploadedFiles(emptyFiles);
    onFilesUploaded(emptyFiles);
  };

  const dropzoneStyle: React.CSSProperties = {
    border: `2px dashed ${isDragOver ? '#4f46e5' : '#d1d5db'}`,
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: isDragOver ? '#f3f4f6' : '#fafafa',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  const fileInfoStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '16px',
    textAlign: 'left',
    width: '100%',
  };

  return (
    <div>
      <div
        style={dropzoneStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {isDragOver ? '📥' : '🎵'}
        </div>
        
        <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
          {isDragOver ? 'ファイルをドロップしてください' : 'ファイルをドラッグ&ドロップ'}
        </h3>
        
        <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
          MP3/WAV + 歌詞TXT + 背景画像（オプション）
        </p>

        <button
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        >
          ファイルを選択
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.m4a,text/*,.txt,.srt,.lrc,image/*,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* アップロード済みファイル情報 */}
      {(uploadedFiles.audioFile || uploadedFiles.lyricsFile || uploadedFiles.backgroundImage) && (
        <div style={fileInfoStyle}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px' 
          }}>
            <h4 style={{ margin: 0, color: '#374151' }}>アップロード済みファイル:</h4>
            <button
              onClick={clearFiles}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              クリア
            </button>
          </div>

          {uploadedFiles.audioFile && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#059669' }}>🎵 音声ファイル</span>
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>アップロード済み</span>
            </div>
          )}

          {uploadedFiles.lyricsFile && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#0d9488' }}>📝 歌詞ファイル</span>
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>{uploadedFiles.lyricsFile}</span>
            </div>
          )}

          {uploadedFiles.backgroundImage && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#7c3aed' }}>🖼️ 背景画像</span>
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>アップロード済み</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};