#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// lyrics-data.jsonを読み込み
const filePath = path.join(__dirname, 'lyrics-data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('🔧 歌詞タイミングを自動修正中...\n');

// タイミングの自動修正
let lastEndTime = 0;
data.lyrics.forEach((lyric, index) => {
    if (index === 0 && lyric.startTime > 0) {
        // 最初の行はそのまま
        lastEndTime = lyric.endTime;
        console.log(`✅ Line ${index + 1}: "${lyric.text.substring(0, 20)}..." OK`);
    } else if (lyric.startTime === 0) {
        // 開始時間が0の行を修正
        lyric.startTime = lastEndTime + 0.1;
        
        // 終了時間が0または開始時間より小さい場合は調整
        if (lyric.endTime === 0 || lyric.endTime <= lyric.startTime) {
            lyric.endTime = lyric.startTime + 3.0; // デフォルト3秒表示
        }
        
        lyric.isSet = true;
        lastEndTime = lyric.endTime;
        
        console.log(`🔄 Line ${index + 1}: 開始時間を ${lyric.startTime.toFixed(2)}秒 に設定`);
    } else {
        lastEndTime = lyric.endTime;
    }
});

// yOffsetの適正化
if (data.style.position === 'bottom' && data.style.yOffset < -200) {
    const oldOffset = data.style.yOffset;
    data.style.yOffset = -80; // 下部から80px上に設定
    console.log(`\n📏 Y座標オフセットを調整: ${oldOffset}px → ${data.style.yOffset}px`);
}

// ファイルに書き戻し
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log('\n✨ 修正完了！');
console.log('📝 変更内容:');
console.log('  - 未設定の開始時間を自動設定');
console.log('  - Y座標オフセットを適正値に調整');
console.log('\nRemotion Studioをリロードして確認してください。');