const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3003;

console.log('🚀 基本サーバー起動中...');

// ディレクトリ確認・作成
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 ディレクトリ作成:', dir);
    }
};

ensureDir('uploads');
ensureDir('output');

const server = http.createServer((req, res) => {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    console.log('📨 リクエスト:', req.method, req.url);
    
    if (req.method === 'GET' && req.url === '/') {
        // ルートページ - simple-app.htmlにリダイレクト
        res.writeHead(302, { 'Location': '/src/simple-app.html' });
        res.end();
        
    } else if (req.method === 'GET' && req.url.startsWith('/src/')) {
        // 静的ファイル配信
        const filePath = path.join(process.cwd(), req.url);
        
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            let contentType = 'text/html';
            
            if (ext === '.js') contentType = 'application/javascript';
            else if (ext === '.css') contentType = 'text/css';
            else if (ext === '.json') contentType = 'application/json';
            
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        }
        
    } else if (req.method === 'GET' && req.url === '/api/health') {
        // ヘルスチェック
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            message: 'サーバー稼働中',
            timestamp: new Date().toISOString()
        }));
        
    } else if (req.method === 'POST' && req.url === '/api/generate-video') {
        // 動画生成（Remotion統合版）
        const multiparty = require('multiparty');
        const form = new multiparty.Form();
        
        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error('❌ フォーム解析エラー:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'フォーム解析エラー' }));
                return;
            }
            
            try {
                console.log('🎬 動画生成リクエスト処理中...');
                
                const lyricsData = fields.lyricsData ? fields.lyricsData[0] : null;
                const format = fields.format ? fields.format[0] : 'youtube';
                const displaySettings = fields.displaySettings ? JSON.parse(fields.displaySettings[0]) : {};
                const mp3File = files.mp3File ? files.mp3File[0] : null;
                
                if (!lyricsData) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '歌詞データが必要です' }));
                    return;
                }
                
                // 歌詞データをパース
                let lyrics;
                try {
                    lyrics = JSON.parse(lyricsData);
                } catch (parseError) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '歌詞データの形式が無効です' }));
                    return;
                }
                
                console.log('✅ 歌詞データ確認完了:', lyrics.length, '行');
                
                // 出力ファイル名
                const timestamp = Date.now();
                const outputFileName = `lyrics-${format}-${timestamp}.mov`;
                const outputPath = path.join('output', outputFileName);
                
                // Remotionコマンド構築（propsを直接渡す）
                const compositionId = format === 'youtube' ? 'DynamicLyrics' : 'DynamicLyricsVertical';
                const width = format === 'youtube' ? 1920 : 1080;
                const height = format === 'youtube' ? 1080 : 1920;
                
                // propsをJSON形式で直接コマンドラインに渡す
                const propsJson = JSON.stringify({
                    lyricsData: lyrics,
                    format: format,
                    position: displaySettings.position || 'bottom',
                    yOffset: displaySettings.yOffset || 0,
                    animationStyle: displaySettings.animationStyle || 'fade',
                    fadeSpeed: displaySettings.fadeSpeed || 0.3,
                    durationOffset: displaySettings.durationOffset || 0,
                    fontSize: displaySettings.fontSize || 48,
                    fontFamily: displaySettings.fontFamily || "'Hiragino Sans', sans-serif",
                    fontColor: displaySettings.fontColor || '#FFFFFF',
                    strokeColor: displaySettings.strokeColor || '#000000',
                    strokeWidth: displaySettings.strokeWidth || 2
                }).replace(/"/g, '\\"');
                
                const remotionCommand = [
                    'npx remotion render',
                    compositionId,
                    `"${outputPath}"`,
                    `--props="${propsJson}"`,
                    '--codec=prores',
                    '--prores-profile=4444',
                    `--width=${width}`,
                    `--height=${height}`,
                    '--timeout=300000'
                ].join(' ');
                
                console.log('⚙️ Remotionコマンド:', remotionCommand);
                
                // Remotion実行
                exec(remotionCommand, { cwd: process.cwd(), timeout: 300000 }, (error, stdout, stderr) => {
                    // 一時ファイル削除
                    try {
                        if (mp3File && fs.existsSync(mp3File.path)) fs.unlinkSync(mp3File.path);
                    } catch (cleanupError) {
                        console.warn('⚠️ 一時ファイル削除エラー:', cleanupError);
                    }
                    
                    if (error) {
                        console.error('❌ Remotion実行エラー:', error.message);
                        console.error('stderr:', stderr);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: '動画生成に失敗しました',
                            details: error.message,
                            stderr: stderr
                        }));
                        return;
                    }
                    
                    console.log('✅ Remotion実行完了');
                    console.log('stdout:', stdout);
                    
                    // 生成ファイル確認
                    if (!fs.existsSync(outputPath)) {
                        console.error('❌ 動画ファイルが生成されませんでした:', outputPath);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: '動画ファイルが生成されませんでした',
                            expectedPath: outputPath
                        }));
                        return;
                    }
                    
                    const fileStats = fs.statSync(outputPath);
                    console.log('📊 生成ファイル情報:', {
                        path: outputPath,
                        size: fileStats.size,
                        created: fileStats.birthtime
                    });
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: '動画生成完了',
                        outputPath: outputPath,
                        downloadUrl: `/api/download/${outputFileName}`,
                        fileSize: fileStats.size,
                        format: format
                    }));
                });
                
            } catch (error) {
                console.error('❌ サーバーエラー:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'サーバーエラー',
                    details: error.message
                }));
            }
        });
        
    } else if (req.method === 'GET' && req.url.startsWith('/api/download/')) {
        // ダウンロード（実際のファイル）
        const filename = req.params ? req.params.filename : req.url.split('/').pop();
        const filePath = path.join('output', filename);
        
        console.log('📥 ダウンロード要求:', filename);
        console.log('📂 ファイルパス:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('❌ ファイルが見つかりません:', filePath);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ファイルが見つかりません' }));
            return;
        }
        
        const fileStats = fs.statSync(filePath);
        console.log('📊 ファイル送信情報:', {
            path: filePath,
            size: fileStats.size,
            contentType: 'video/quicktime'
        });
        
        res.writeHead(200, {
            'Content-Type': 'video/quicktime',
            'Content-Length': fileStats.size,
            'Content-Disposition': `attachment; filename="${filename}"`
        });
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
        
        readStream.on('end', () => {
            console.log('✅ ダウンロード完了:', filename);
        });
        
        readStream.on('error', (error) => {
            console.error('❌ ダウンロードエラー:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'ダウンロードに失敗しました' }));
            }
        });
        
    } else {
        // 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'エンドポイントが見つかりません' }));
    }
});

server.listen(PORT, () => {
    console.log(`
🎵 基本サーバー起動完了！

📍 サーバーURL: http://localhost:${PORT}
🌐 アプリURL: http://localhost:8080/src/simple-app.html
📊 ヘルスチェック: http://localhost:${PORT}/api/health

🚀 動画生成テストの準備完了！
    `);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
    console.log('\n🛑 サーバーを停止しています...');
    server.close(() => {
        console.log('✅ サーバー停止完了');
        process.exit(0);
    });
});

console.log('🎯 サーバー設定完了 - リクエスト待機中...');