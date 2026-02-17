# 歌詞オーバーレイ制作ワークフロー

## 1. タイミング編集
1. 別ターミナルで `node simple-server.js` を起動しておく（直接保存API用）。
2. Finder で `timing-editor.html` をダブルクリックして開く。
3. 歌詞&スタイルを調整し、`🎯 src/lyrics-data.json に直接保存` を押す。
   - 成功メッセージが出れば `src/lyrics-data.json` に即反映。
   - 失敗したら JSON ダウンロード → 手動で `src/lyrics-data.json` に置き換える。

## 2. Remotion Studio で確認
1. プロジェクトルートで `npm start`。
2. ブラウザで `http://localhost:3000` を開き直す。
   - `src/lyrics-data.json` の最新内容が自動で読み込まれる。
3. タイムラインで最後まで歌詞が表示されるかチェック。

## 3. レンダリング
- GUI: Remotion Studio の Render ボタン。
- CLI: `npx remotion render LyricsMatch out/lyrics.mov --codec=prores --prores-profile=4444`
  - プレビュー用に MP4 が欲しければ `--codec=h264` を使う。

## 補足
- `scripts/generate-lyrics.js lyrics.txt 180` で歌詞データと参考フレーム数を生成可能。
- 直接保存に失敗したら `node simple-server.js` が起動しているか確認。
