# Lyrics Overlay プロジェクト 現状報告書

## 問題の概要
Remotion Studioで表示される歌詞の垂直位置が期待した位置とずれている問題が発生しています。

## 現在の実装状況

### 1. プロジェクト構成
- **フレームワーク**: Remotion (React-based video creation framework)
- **メインコンポーネント**: `/src/compositions/LyricsMatch.tsx`
- **設定ファイル**: `/src/lyrics-data.json`
- **エディターツール**: `/timing-editor.html`

### 2. 実装済みの機能
#### LyricsMatch.tsx のコード
```typescript
export const LyricsMatch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // 現在表示すべき歌詞を探す
  const currentLyric = lyricsData.lyrics.find(
    lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
  );

  if (!currentLyric) {
    return <AbsoluteFill style={{ backgroundColor: 'transparent' }} />;
  }

  // フェードイン/アウト
  const progress = (currentTime - currentLyric.startTime) / (currentLyric.endTime - currentLyric.startTime);
  const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // スタイル設定をJSONから読み込み
  const { style } = lyricsData;
  
  // 位置の計算（timing-editor.htmlと同じロジック）
  const getAlignItems = (position: string) => {
    switch(position) {
      case 'top': return 'flex-start';
      case 'center': return 'center';
      case 'bottom': return 'flex-end';
      default: return 'flex-end';
    }
  };

  return (
    <AbsoluteFill style={{ 
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: getAlignItems(style.position),
      justifyContent: 'center'
    }}>
      <span style={{
        fontSize: `${style.fontSize}px`,
        color: style.fontColor,
        textShadow: `0 0 ${style.strokeWidth}px ${style.strokeColor}`,
        fontFamily: style.fontFamily,
        transform: `translateY(${style.yOffset}px)`,
        opacity,
        lineHeight: 1.5
      }}>
        {currentLyric.text}
      </span>
    </AbsoluteFill>
  );
};
```

#### 現在のJSON設定
```json
{
  "style": {
    "fontSize": 48,
    "fontColor": "#ffffff",
    "strokeColor": "#000000",
    "strokeWidth": 2,
    "position": "bottom",
    "fontFamily": "'Hiragino Sans', 'Yu Gothic', sans-serif",
    "yOffset": 0
  }
}
```

## 問題の詳細

### 症状
1. **position: "bottom"** に設定しているが、歌詞が画面の下部に正しく表示されない
2. **yOffset: 0** に設定しても、期待した位置に表示されない
3. スクリーンショットでは、歌詞が画面中央付近に表示されている

### これまでに試した解決策
1. ✅ JSONからスタイル設定を動的に読み込むように修正
2. ✅ position値に基づいてalignItemsを設定する機能を実装
3. ✅ yOffsetをtransformで適用
4. ✅ timing-editor.htmlと同じ計算ロジックを実装

## 技術的な考察

### 可能性のある原因
1. **Remotionの`AbsoluteFill`コンポーネントの特性**
   - AbsoluteFillは`position: absolute`で全画面をカバーする
   - 親要素のサイズや配置に影響される可能性

2. **ビデオの解像度との不整合**
   - デフォルトのビデオ解像度（1920x1080）と実際のプレビューサイズの違い
   - レスポンシブな調整が必要な可能性

3. **Flexboxの計算**
   - `alignItems: 'flex-end'`が期待通りに動作していない可能性
   - 追加のコンテナ要素が必要かもしれない

## 提案される解決策

### 方法1: 絶対配置を使用
```typescript
<AbsoluteFill>
  <div style={{
    position: 'absolute',
    bottom: `${Math.abs(style.yOffset)}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    textAlign: 'center'
  }}>
    <span style={{...}}>
      {currentLyric.text}
    </span>
  </div>
</AbsoluteFill>
```

### 方法2: パディングを使用した配置
```typescript
<AbsoluteFill style={{
  paddingBottom: `${100 + style.yOffset}px`,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center'
}}>
```

### 方法3: Remotionの`useVideoConfig`で解像度を取得して計算
```typescript
const { height } = useVideoConfig();
const bottomPosition = height - 100 + style.yOffset;
```

## 次のステップ
1. 上記の解決策を順番に試す
2. Remotionのドキュメントで推奨される位置調整方法を確認
3. 実際のビデオ出力での表示位置も確認する

## 質問事項
- 期待する「正しい位置」は具体的にどこですか？（画面下から何ピクセルなど）
- プレビューと実際の動画出力で同じ問題が発生していますか？
- 他のRemotionプロジェクトでの実装例はありますか？

---
作成日: 2025-09-03
作成者: Claude Code Assistant