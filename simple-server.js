const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 3002;

console.log('🚀 サーバー初期化中...');

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static('src'));

// ディレクトリ作成
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 ディレクトリ作成:', dir);
    }
};

ensureDir('uploads');
ensureDir('output');

// ファイルアップロード設定
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

console.log('🔧 ミドルウェア設定完了');

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
    console.log('📊 ヘルスチェック要求');
    res.json({ 
        status: 'ok', 
        message: 'サーバー稼働中',
        timestamp: new Date().toISOString()
    });
});

// 動画生成エンドポイント
app.post('/api/generate-video', upload.single('mp3File'), async (req, res) => {
    console.log('🎬 動画生成リクエスト受信');
    
    try {
        const { lyricsData, format = 'youtube', duration = 30 } = req.body;
        const mp3File = req.file;
        
        console.log('📝 受信データ:', {
            format,
            duration,
            lyricsCount: JSON.parse(lyricsData || '[]').length,
            mp3File: mp3File ? mp3File.filename : 'なし'
        });
        
        if (!lyricsData) {
            return res.status(400).json({ error: '歌詞データが必要です' });
        }
        
        // 歌詞データをパース
        let lyrics;
        try {
            lyrics = JSON.parse(lyricsData);
        } catch (error) {
            return res.status(400).json({ error: '歌詞データの形式が無効です' });
        }
        
        if (!Array.isArray(lyrics) || lyrics.length === 0) {
            return res.status(400).json({ error: '有効な歌詞データがありません' });
        }
        
        console.log('✅ 歌詞データ確認完了:', lyrics.length, '行');
        
        // Remotion用の設定ファイル作成
        const timestamp = Date.now();
        const configData = {
            lyricsData: lyrics,
            format,
            duration: parseFloat(duration),
            mp3Path: mp3File ? mp3File.path : null,
            timestamp
        };
        
        const configPath = path.join('uploads', `config-${timestamp}.json`);
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
        console.log('📄 設定ファイル作成:', configPath);
        
        // 出力ファイル名
        const outputFileName = `lyrics-${format}-${timestamp}.mov`;
        const outputPath = path.join('output', outputFileName);
        
        console.log('🎯 出力パス:', outputPath);
        
        // Remotionコマンドを構築
        const compositionId = format === 'youtube' ? 'DynamicLyrics' : 'DynamicLyricsVertical';
        const width = format === 'youtube' ? 1920 : 1080;
        const height = format === 'youtube' ? 1080 : 1920;
        
        const remotionCommand = [
            'npx remotion render',
            compositionId,
            `"${outputPath}"`,
            `--props="${configPath}"`,
            '--codec=prores',
            '--prores-profile=4444',
            `--width=${width}`,
            `--height=${height}`,
            '--timeout=300000'
        ].join(' ');
        
        console.log('⚙️ Remotionコマンド:', remotionCommand);
        
        // コマンド実行
        exec(remotionCommand, { cwd: process.cwd(), timeout: 300000 }, (error, stdout, stderr) => {
            // 一時ファイル削除
            try {
                if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
                if (mp3File && fs.existsSync(mp3File.path)) fs.unlinkSync(mp3File.path);
            } catch (cleanupError) {
                console.warn('⚠️ 一時ファイル削除エラー:', cleanupError);
            }
            
            if (error) {
                console.error('❌ Remotion実行エラー:', error.message);
                console.error('stderr:', stderr);
                return res.status(500).json({
                    error: '動画生成に失敗しました',
                    details: error.message,
                    stderr: stderr
                });
            }
            
            console.log('✅ Remotion実行完了');
            console.log('stdout:', stdout);
            
            // 生成ファイル確認
            if (!fs.existsSync(outputPath)) {
                console.error('❌ 動画ファイルが生成されませんでした:', outputPath);
                return res.status(500).json({
                    error: '動画ファイルが生成されませんでした',
                    expectedPath: outputPath
                });
            }
            
            const fileStats = fs.statSync(outputPath);
            console.log('📊 生成ファイル情報:', {
                path: outputPath,
                size: fileStats.size,
                created: fileStats.birthtime
            });
            
            res.json({
                success: true,
                message: '動画生成完了',
                outputPath: outputPath,
                downloadUrl: `/api/download/${outputFileName}`,
                fileSize: fileStats.size,
                format: format,
                duration: duration
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

// ダウンロードエンドポイント
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join('output', filename);
    
    console.log('📥 ダウンロード要求:', filename);
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ ファイルが見つかりません:', filePath);
        return res.status(404).json({ error: 'ファイルが見つかりません' });
    }
    
    res.download(filePath, filename, (error) => {
        if (error) {
            console.error('❌ ダウンロードエラー:', error);
            res.status(500).json({ error: 'ダウンロードに失敗しました' });
        } else {
            console.log('✅ ダウンロード完了:', filename);
        }
    });
});

// 歌詞データ保存エンドポイント
app.post('/api/save-lyrics', (req, res) => {
    const { lyrics, style } = req.body || {};

    if (!Array.isArray(lyrics) || lyrics.length === 0) {
        return res.status(400).json({
            success: false,
            error: '歌詞データが空か、配列ではありません。'
        });
    }

    const normalizedLyrics = lyrics.map((line) => ({
        text: line.text,
        startTime: Number(line.startTime) || 0,
        endTime: Number(line.endTime) || 0,
        isSet: line.isSet !== false,
        confidence: typeof line.confidence === 'number' ? line.confidence : 1.0,
    }));

    const payload = {
        lyrics: normalizedLyrics,
        style: style || {},
    };

    const targetPath = path.join(__dirname, 'src', 'lyrics-data.json');

    try {
        fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2));
        console.log('💾 歌詞データを保存しました:', targetPath);
        res.json({ success: true, path: targetPath, lines: normalizedLyrics.length });
    } catch (error) {
        console.error('❌ 歌詞データ保存エラー:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// エラーハンドリング
app.use((error, req, res, next) => {
    console.error('🚨 予期しないエラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`
🎵 歌詞動画ジェネレーター サーバー起動完了！

📍 サーバーURL: http://localhost:${PORT}
🌐 アプリURL: http://localhost:8080/src/simple-app.html
📊 ヘルスチェック: http://localhost:${PORT}/api/health
🎬 動画生成: POST http://localhost:${PORT}/api/generate-video

🚀 準備完了！動画生成をお楽しみください。
    `);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
    console.log('\n🛑 サーバーを停止しています...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 予期しない例外:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 未処理のPromise rejection:', reason);
});
