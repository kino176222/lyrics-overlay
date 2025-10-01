#!/usr/bin/env node

// 歌詞タイミングエディターから呼び出される自動保存スクリプト
// 使用方法: node save-lyrics-data.js '{"lyrics":...}'

const fs = require('fs');
const path = require('path');

// 引数からJSONデータを取得
const jsonData = process.argv[2];
if (!jsonData) {
    console.error('❌ エラー: JSONデータが指定されていません');
    console.error('使用方法: node save-lyrics-data.js \'{"lyrics":...}\'');
    process.exit(1);
}

const targetPath = path.join(__dirname, 'src', 'lyrics-data.json');

try {
    // JSONの妥当性をチェック
    const parsedData = JSON.parse(jsonData);

    // フォーマットして保存
    fs.writeFileSync(targetPath, JSON.stringify(parsedData, null, 2));

    console.log('✅ 歌詞データを保存しました:');
    console.log(`📁 ${targetPath}`);
    console.log('');
    console.log('🎬 動画レンダリング方法:');
    console.log('1. GUI: http://localhost:3000 でRenderボタンを押す');
    console.log('2. CLI: npx remotion render LyricsMatch out/lyrics.mov --codec=prores --prores-profile=4444');

} catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
}