# 🎵 歌詞動画エディター - Remotion Studio版

MP3と歌詞から直感的に歌詞動画を作成するツール

## 🚀 特徴

- **完全WYSIWYG**: プレビュー = 出力の完全一致
- **直感操作**: 音楽を聞きながらリアルタイム編集
- **高品質出力**: ProRes 4444（透明背景）でFinal Cut Pro互換
- **マルチフォーマット**: YouTube横動画 & TikTok/Instagram縦動画

## 📋 使い方

### 1. 開発環境の起動
```bash
npm start
```

### 2. Remotion Studio画面
ブラウザで自動的に開く編集画面で：

- **プロパティパネル**: フォント、サイズ、色などを調整
- **タイムライン**: 歌詞のタイミングを調整
- **プレビュー**: リアルタイムで結果確認

### 3. 動画出力
```bash
npm run render LyricsVideoYouTube output/my-video.mov
```

## 🎨 編集可能な設定

### フォント設定
- `fontFamily`: しっぽり明朝（デフォルト）
- `fontSize`: 48px（YouTube）/ 54px（縦動画）
- `fontColor`: 文字色
- `strokeColor`: 縁取り色
- `strokeWidth`: 縁取り太さ

### レイアウト設定  
- `position`: bottom / center / top
- `yOffset`: 垂直位置の微調整

### アニメーション設定
- `animationStyle`: fade / slide / scale / bounce
- `fadeSpeed`: アニメーション速度
- `durationOffset`: 全体のタイミング調整

## 🔧 技術仕様

- **出力フォーマット**: ProRes 4444 (透明背景)
- **フレームレート**: 60fps
- **解像度**: 
  - YouTube: 1920x1080
  - TikTok/Instagram: 1080x1920

## 📂 ファイル構成

```
src/
├── Root.tsx              # Remotion登録・設定
├── index.ts              # エントリーポイント  
└── components/
    └── LyricsEditor.tsx  # メイン歌詞エディター
```

## 🎯 次の開発予定

1. ドラッグ&ドロップでMP3/歌詞アップロード
2. AI自動タイミング認識
3. 複数フォーマット一括出力
4. カスタムアニメーション追加