#!/usr/bin/env node

// フォントサイズ変更スクリプト
// 使用方法: node update-font-size.js 64

const fs = require('fs');
const path = require('path');

const newSize = process.argv[2];
if (!newSize) {
  console.error('使用方法: node update-font-size.js <新しいフォントサイズ>');
  console.error('例: node update-font-size.js 64');
  process.exit(1);
}

const lyricsDataPath = path.join(__dirname, 'src', 'lyrics-data.json');

try {
  // JSONファイルを読み込み
  const data = JSON.parse(fs.readFileSync(lyricsDataPath, 'utf8'));

  // フォントサイズを更新
  const oldSize = data.style.fontSize;
  data.style.fontSize = parseInt(newSize);

  // ファイルに書き戻し
  fs.writeFileSync(lyricsDataPath, JSON.stringify(data, null, 2));

  console.log(`✅ フォントサイズを ${oldSize}px から ${newSize}px に変更しました`);
  console.log('');
  console.log('🎬 レンダリング方法:');
  console.log('1. GUI (推奨): http://localhost:3000 でRenderボタンを押す');
  console.log('2. CLI: npx remotion render LyricsMatch out/lyrics.mov --codec=prores --prores-profile=4444');

} catch (error) {
  console.error('❌ エラー:', error.message);
  process.exit(1);
}