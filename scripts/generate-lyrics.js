#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// コマンドライン引数を取得
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('使用方法: node generate-lyrics.js <歌詞ファイル.txt> <音声の長さ（秒）>');
    console.log('例: node generate-lyrics.js lyrics.txt 180');
    process.exit(1);
}

const lyricsFile = args[0];
const duration = parseFloat(args[1]);

if (!fs.existsSync(lyricsFile)) {
    console.error(`エラー: ファイル ${lyricsFile} が見つかりません`);
    process.exit(1);
}

// 歌詞ファイルを読み込む
const lyricsText = fs.readFileSync(lyricsFile, 'utf-8');
const lines = lyricsText.split('\n').filter(line => line.trim());

if (lines.length === 0) {
    console.error('エラー: 歌詞ファイルが空です');
    process.exit(1);
}

// 各行の表示時間を計算
const timePerLine = duration / lines.length;

// 歌詞データを生成
const lyricsData = lines.map((text, index) => ({
    startTime: Math.round(index * timePerLine * 10) / 10,
    endTime: Math.round((index + 1) * timePerLine * 10) / 10,
    text: text.trim()
}));

// JSONファイルとして保存
const outputPath = path.join(__dirname, '..', 'src', 'lyrics-data.json');
fs.writeFileSync(outputPath, JSON.stringify(lyricsData, null, 2));

console.log('✅ 歌詞データを生成しました！');
console.log(`📁 保存先: ${outputPath}`);
console.log(`📊 歌詞の行数: ${lines.length}`);
console.log(`⏱️  1行あたりの表示時間: ${timePerLine.toFixed(1)}秒`);

// Root.tsxのdurationInFramesも更新
const rootPath = path.join(__dirname, '..', 'src', 'Root.tsx');
const rootContent = fs.readFileSync(rootPath, 'utf-8');
const newDurationInFrames = Math.ceil(duration * 30); // 30fps

const updatedRoot = rootContent.replace(
    /durationInFrames=\{\d+\}/g,
    `durationInFrames={${newDurationInFrames}}`
);

fs.writeFileSync(rootPath, updatedRoot);
console.log(`🎬 動画の長さを ${duration}秒 (${newDurationInFrames}フレーム) に設定しました`);