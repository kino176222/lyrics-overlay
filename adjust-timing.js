// タイミング調整スクリプト
const fs = require('fs');

// 現在の歌詞データを読み込み
const lyricsData = JSON.parse(fs.readFileSync('src/lyrics-data.json', 'utf8'));

// 全ての時間を調整（例：5秒早める）
const adjustedLyrics = lyricsData.map(lyric => ({
    ...lyric,
    startTime: Math.max(0, lyric.startTime - 5), // 5秒早める（0より小さくならないように）
    endTime: Math.max(0, lyric.endTime - 5)
}));

// 保存
fs.writeFileSync('src/lyrics-data.json', JSON.stringify(adjustedLyrics, null, 2));
console.log('タイミングを5秒早めました！');