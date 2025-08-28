# 音声同期プレビュー 表示問題 デバッグログ

## 🔍 問題の症状
- 音声同期プレビューで歌詞が画面に表示されない
- コンソールログでは正常に動作している

## 📊 動作確認済みの機能
### ✅ 正常動作
- 通常プレビュー（静的表示）: 動作OK
- 歌詞データ作成: OK (23行)
- AI音声認識: OK (264秒、323セグメント)
- タイミング計算: OK
- DOM要素生成: OK

### ⚠️ 表示問題
- 音声同期プレビューの歌詞が画面に見えない

## 🧪 コンソールログ分析

### 成功しているログ
```
🎵 リアルタイムプレビュー開始
歌詞データ: (23) [{…}, {…}, ...]
表示設定: {position: 'bottom', yOffset: 0, ...}

モーダル表示状態:
- modalClasses: 'modal show'
- modalDisplay: 'flex'
- containerClasses: 'preview-container preview-youtube'  
- lyricsClasses: 'preview-lyrics youtube'

🎤 表示: [11.49秒] 思考のスピードに 追いつけなくて
previewLyrics要素: [正常なDOM要素]
previewLyrics可視性:
- display: 'block'
- visibility: 'visible'
- opacity: '1'

歌詞要素追加後: <div style="...完全なスタイル設定...">歌詞テキスト</div>
```

## 🔧 実装済みの修正

### 1. プレビュー画面サイズ修正
- YouTube: 960x540px (Final Cut Pro対応サイズ)
- TikTok: 540x960px

### 2. 音声同期機能の強化
- イベントリスナーの重複登録防止
- 詳細なデバッグログ追加
- DOM要素の可視性確認

### 3. フォント選択機能
- 10種類のフォント（ゴシック、明朝、丸ゴシックなど）
- サーバー側もfontFamily対応

### 4. デバッグボタン
- 🔍 タイミング確認
- 🧪 テストタイミング（0秒から）
- 🔄 タイミングリセット

## 🚨 推定原因と解決策

### 最も可能性の高い原因
1. **z-index競合**: 他の要素に隠れている
2. **位置設定**: モーダルが画面外に配置
3. **CSSアニメーション**: アニメーションクラスが存在しない

### 次回作業時の優先修正項目
1. **CSSアニメーションクラスの存在確認**
   - `fadeIn`, `slideIn`, `scaleIn` などのCSS定義
2. **z-indexの調整**
   - モーダル要素のz-index値を確認・調整
3. **位置設定の見直し**
   - プレビュー要素の絶対位置指定を確認

## 🛠️ 次回作業時のデバッグ手順

### Step 1: 環境確認
```bash
cd /Users/kino/Documents/Mynote/lyrics-overlay
node basic-server.js &
open http://localhost:3003/src/simple-app.html
```

### Step 2: 問題の再現
1. 歌詞入力
2. 「🧪 テストタイミング（0秒から）」
3. 「🎵 音声同期プレビュー」
4. F12でコンソール確認

### Step 3: DOM検証
ブラウザデベロッパーツールで：
```
document.querySelector('#previewLyrics').getBoundingClientRect()
```

## 📁 関連ファイル

### 主要変更ファイル
- `src/simple-app.html` - メインアプリ（フォント選択・音声同期実装済み）
- `basic-server.js` - サーバー（fontFamily対応済み）
- `PROGRESS.md` - 進捗管理（UI/UX 100%完了）

### Remotionファイル
- `src/compositions/DynamicLyricsOverlay.tsx` - 動画生成用コンポーネント

## 🎯 残作業

### 最優先（MVP完成のため）
1. 音声同期プレビューの表示問題解決
2. 動画生成機能の最終テスト

### 追加機能
1. より多くのフォント追加
2. AI認識精度の向上
3. 複数フォーマット同時出力

---
*デバッグログ作成日: 2025-08-28*
*現在のMVP進捗: 95% (表示問題解決で100%)*