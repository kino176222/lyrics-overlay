# 歌詞オーバーレイの使い方 🎵

## 超簡単！3ステップで歌詞動画を作る方法

### ステップ1: 歌詞を準備する 📝

`src/lyrics-data.json` ファイルを開いて、あなたの歌詞を入力します。

```json
[
  {
    "startTime": 0,    // 表示開始（秒）
    "endTime": 3,      // 表示終了（秒）
    "text": "君に会えたその日から"  // 歌詞
  },
  {
    "startTime": 3,
    "endTime": 6,
    "text": "世界が輝いて見えた"
  }
]
```

**ポイント:**
- `startTime`: 歌詞が表示され始める時間（秒）
- `endTime`: 歌詞が消える時間（秒）
- `text`: 表示したい歌詞

### ステップ2: プレビューで確認 👀

ターミナルで以下のコマンドを実行：
```bash
npm start
```

ブラウザが開いて、歌詞のアニメーションを確認できます！

### ステップ3: 動画を出力 🎬

透過背景で動画を作成：
```bash
npm run build:transparent
```

`out/lyrics-transparent.mov` というファイルができます！

## Final Cut Proで使う方法 🎥

1. Final Cut Proを開く
2. **ファイル → インポート → メディア** を選択
3. `out/lyrics-transparent.mov` を選択
4. タイムラインのメイン動画の**上**に配置
5. 完成！歌詞が動画に重なって表示されます

## よくある質問 ❓

### Q: 歌詞のタイミングがずれてる！
A: `lyrics-data.json` の `startTime` と `endTime` の数値を調整してください。

### Q: 文字の大きさを変えたい！
A: `src/compositions/LyricsOverlay.tsx` の `fontSize: '60px'` の数値を変更。

### Q: 歌詞の位置を変えたい！
A: 同じファイルの `bottom: '150px'` を変更。
- 数値を大きくする → 歌詞が上に移動
- 数値を小さくする → 歌詞が下に移動

### Q: 動画の長さを変えたい！
A: `src/Root.tsx` の `durationInFrames={900}` を変更。
- 30秒の動画 = 30秒 × 30fps = 900フレーム
- 60秒の動画 = 60秒 × 30fps = 1800フレーム

## 歌詞ファイルの例 📄

例えば、こんな感じで書きます：

```json
[
  {
    "startTime": 0,
    "endTime": 3,
    "text": "♪ イントロ ♪"
  },
  {
    "startTime": 3,
    "endTime": 7,
    "text": "朝日が昇る街で"
  },
  {
    "startTime": 7,
    "endTime": 11,
    "text": "新しい一日が始まる"
  },
  {
    "startTime": 11,
    "endTime": 15,
    "text": "君と歩くこの道"
  }
]
```

## 困ったときは 🆘

1. エラーが出た → `npm install` をもう一度実行
2. 動画が作れない → `npm run build:transparent` をもう一度実行
3. それでもダメ → ファイルを保存し忘れてないか確認！

---

楽しい歌詞動画を作ってください！ 🎉