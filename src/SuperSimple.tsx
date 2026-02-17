import React, { useState } from 'react';
import { Composition } from 'remotion';
import { LyricsEditor, LyricsLine } from './components/LyricsEditor';

// 超シンプル：全部同じ場所で管理
const SimpleLyricsApp: React.FC = () => {
  // データは1か所だけ
  const [lyrics, setLyrics] = useState<LyricsLine[]>([
    { text: "君の笑顔が好きなんだ", startTime: 0, endTime: 3, confidence: 1.0 },
    { text: "この瞬間を忘れないで", startTime: 3, endTime: 6, confidence: 1.0 },
  ]);

  const [previewMode, setPreviewMode] = useState<'edit' | 'youtube' | 'tiktok'>('edit');

  // 編集画面
  if (previewMode === 'edit') {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1a1a1a', height: '100vh' }}>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setPreviewMode('youtube')} 
            style={{ marginRight: '10px', padding: '10px 20px' }}>
            YouTube プレビュー
          </button>
          <button onClick={() => setPreviewMode('tiktok')}
            style={{ padding: '10px 20px' }}>
            TikTok プレビュー
          </button>
        </div>
        
        {/* 歌詞編集 */}
        {lyrics.map((line, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <input
              value={line.text}
              onChange={(e) => {
                const newLyrics = [...lyrics];
                newLyrics[i].text = e.target.value;
                setLyrics(newLyrics);
              }}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                backgroundColor: '#333',
                color: 'white',
                border: '1px solid #555'
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // プレビュー画面
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <button 
        onClick={() => setPreviewMode('edit')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 100,
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        ← 編集に戻る
      </button>
      
      <LyricsEditor
        format={previewMode === 'youtube' ? 'youtube' : 'vertical'}
        lyricsData={lyrics}
        fontFamily="'Shippori Mincho', serif"
        fontSize={48}
        fontColor="#FFFFFF"
        strokeColor="#000000"
        strokeWidth={2}
        position="bottom"
      />
    </div>
  );
};

// Remotionの設定（超シンプル：1つだけ）
export const SuperSimpleRoot: React.FC = () => {
  return (
    <Composition
      id="SimpleLyrics"
      component={SimpleLyricsApp}
      durationInFrames={1800} // 60秒
      fps={30}
      width={1920}
      height={1080}
    />
  );
};