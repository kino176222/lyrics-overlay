const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 3002;

// CORS設定
app.use(cors());
app.use(express.json());
app.use(express.static('src'));
app.use('/public', express.static('public'));

// ファイルアップロード設定
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// 一時ファイル保存ディレクトリ
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir('uploads');
ensureDir('temp');
ensureDir('output');

/**
 * 動画生成エンドポイント
 */
app.post('/api/generate-video', upload.fields([
  { name: 'mp3File', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), async (req, res) => {
  console.log('🎬 動画生成リクエスト受信');
  
  try {
    const { lyricsData, format = 'youtube', duration = 30 } = req.body;
    const files = req.files;
    
    if (!lyricsData) {
      return res.status(400).json({ error: '歌詞データが必要です' });
    }

    // 歌詞データをパース
    let lyrics;
    try {
      lyrics = typeof lyricsData === 'string' ? JSON.parse(lyricsData) : lyricsData;
    } catch (error) {
      return res.status(400).json({ error: '歌詞データの形式が無効です' });
    }

    // ファイルパスを設定
    const mp3Path = files.mp3File ? files.mp3File[0].path : null;
    const backgroundImagePath = files.backgroundImage ? files.backgroundImage[0].path : null;

    // Remotion用の一時設定ファイルを作成
    const configData = {
      lyricsData: lyrics,
      format,
      duration: parseFloat(duration),
      backgroundImage: backgroundImagePath,
      timestamp: Date.now(),
    };

    const configPath = path.join('temp', `config-${configData.timestamp}.json`);
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

    // 出力ファイル名
    const outputFileName = `lyrics-${format}-${configData.timestamp}.mov`;
    const outputPath = path.join('output', outputFileName);

    console.log('📝 設定ファイル作成:', configPath);
    console.log('🎯 出力パス:', outputPath);

    // Remotionコマンドを実行
    const remotionCommand = `npx remotion render DynamicLyrics "${outputPath}" --props="${configPath}" --codec=prores --prores-profile=4444`;
    
    console.log('⚙️ Remotionコマンド実行中...');
    console.log(remotionCommand);

    exec(remotionCommand, { timeout: 300000 }, (error, stdout, stderr) => {
      // 一時ファイルを削除
      try {
        if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
        if (mp3Path && fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
        if (backgroundImagePath && fs.existsSync(backgroundImagePath)) fs.unlinkSync(backgroundImagePath);
      } catch (cleanupError) {
        console.warn('⚠️ 一時ファイル削除エラー:', cleanupError.message);
      }

      if (error) {
        console.error('❌ Remotion実行エラー:', error);
        console.error('stderr:', stderr);
        return res.status(500).json({ 
          error: '動画生成に失敗しました',
          details: error.message,
          stderr: stderr 
        });
      }

      console.log('✅ 動画生成完了:', outputPath);
      console.log('stdout:', stdout);

      // 生成された動画ファイルが存在するかチェック
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ 
          error: '動画ファイルが生成されませんでした',
          expectedPath: outputPath 
        });
      }

      res.json({
        success: true,
        message: '動画生成完了',
        outputPath: outputPath,
        downloadUrl: `/api/download/${outputFileName}`,
        fileSize: fs.statSync(outputPath).size,
      });
    });

  } catch (error) {
    console.error('❌ サーバーエラー:', error);
    res.status(500).json({ 
      error: 'サーバーエラー',
      details: error.message 
    });
  }
});

/**
 * 動画ダウンロードエンドポイント
 */
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('output', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ファイルが見つかりません' });
  }

  res.download(filePath, filename, (error) => {
    if (error) {
      console.error('ダウンロードエラー:', error);
      res.status(500).json({ error: 'ダウンロードに失敗しました' });
    }
  });
});

/**
 * プレビュー用エンドポイント
 */
app.post('/api/preview', upload.single('backgroundImage'), (req, res) => {
  try {
    const { lyricsData, format, currentTime = 0 } = req.body;
    
    // プレビュー用の簡易HTML生成
    const previewHtml = generatePreviewHtml(lyricsData, format, currentTime);
    
    res.json({
      success: true,
      previewHtml,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * プレビューHTML生成
 */
function generatePreviewHtml(lyricsData, format, currentTime) {
  const lyrics = typeof lyricsData === 'string' ? JSON.parse(lyricsData) : lyricsData;
  const currentLyrics = lyrics.filter(
    line => currentTime >= line.startTime && currentTime <= line.endTime
  );

  const isVertical = format === 'tiktok' || format === 'instagram';
  const containerStyle = isVertical 
    ? 'width: 300px; height: 533px; aspect-ratio: 9/16;'
    : 'width: 400px; height: 225px; aspect-ratio: 16/9;';

  return `
    <div style="${containerStyle} background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                position: relative; border-radius: 8px; overflow: hidden; margin: 20px auto;">
      <div style="position: absolute; bottom: ${isVertical ? '50%' : '20%'}; left: 50%; 
                  transform: translateX(-50%); color: white; text-align: center; 
                  font-family: Arial, sans-serif; font-size: ${isVertical ? '16px' : '18px'}; 
                  font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
        ${currentLyrics.map(line => `<div style="margin-bottom: 5px;">${line.text}</div>`).join('')}
      </div>
    </div>
  `;
}

/**
 * ヘルスチェック
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '歌詞動画ジェネレーターサーバー稼働中',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 利用可能なフォーマット一覧
 */
app.get('/api/formats', (req, res) => {
  res.json({
    formats: [
      {
        id: 'youtube',
        name: 'YouTube',
        dimensions: '1920x1080',
        aspectRatio: '16:9',
        description: 'YouTube用横動画'
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        dimensions: '1080x1920',
        aspectRatio: '9:16',
        description: 'TikTok用縦動画'
      },
      {
        id: 'instagram',
        name: 'Instagram',
        dimensions: '1080x1920',
        aspectRatio: '9:16',
        description: 'Instagram Reels用縦動画'
      }
    ]
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`
🎵 歌詞動画ジェネレーター サーバー起動！

📍 サーバーURL: http://localhost:${PORT}
🌐 アプリURL: http://localhost:${PORT}/app.html
📊 ヘルスチェック: http://localhost:${PORT}/api/health

🚀 準備完了！アプリをお楽しみください。
  `);
});

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('予期しないエラー:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise rejection:', reason);
});

module.exports = app;