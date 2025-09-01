import React from 'react';

export interface StyleSettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontColor: string;
  strokeColor: string;
  strokeWidth: number;
  position: 'bottom' | 'center' | 'top';
  yOffset: number;
  animationStyle: 'fade' | 'slide' | 'scale' | 'bounce' | 'typewriter' | 'blur' | 'rotate' | 'wave';
  fadeSpeed: number;
  glowEffect?: 'none' | 'weak' | 'soft' | 'strong' | 'neon' | 'pulse' | 'rainbow';
  glowColor?: string;
  textWrap?: 'nowrap' | 'wrap' | 'auto';
}

export interface StyleControlsProps {
  settings: StyleSettings;
  onSettingsChange: (settings: StyleSettings) => void;
  style?: React.CSSProperties;
}

export const StyleControls: React.FC<StyleControlsProps> = ({
  settings,
  onSettingsChange,
  style = {},
}) => {
  const updateSetting = <K extends keyof StyleSettings>(
    key: K,
    value: StyleSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    ...style,
  };

  const controlGroupStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    outline: 'none',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: '#d1d5db',
    outline: 'none',
    cursor: 'pointer',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '14px', 
        fontWeight: 'bold', 
        color: '#374151' 
      }}>
        🎨 スタイル設定
      </h3>

      {/* フォント */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>フォント</label>
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          style={selectStyle}
        >
          <option value="'Shippori Mincho', 'しっぽり明朝', serif">しっぽり明朝</option>
          <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
          <option value="'M PLUS Rounded 1c', sans-serif">M PLUS Rounded</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
        </select>
      </div>

      {/* フォントサイズ */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>フォントサイズ: {settings.fontSize}px</label>
        <input
          type="range"
          min="24"
          max="120"
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
          style={sliderStyle}
        />
      </div>

      {/* 文字色 */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>文字色</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={settings.fontColor}
            onChange={(e) => updateSetting('fontColor', e.target.value)}
            style={{ 
              width: '40px', 
              height: '30px', 
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            value={settings.fontColor}
            onChange={(e) => updateSetting('fontColor', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="#000000"
          />
        </div>
      </div>

      {/* 縁取り色 */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>縁取り色</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={settings.strokeColor}
            onChange={(e) => updateSetting('strokeColor', e.target.value)}
            style={{ 
              width: '40px', 
              height: '30px', 
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            value={settings.strokeColor}
            onChange={(e) => updateSetting('strokeColor', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      {/* 縁取り幅 */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>縁取り幅: {settings.strokeWidth}px</label>
        <input
          type="range"
          min="0"
          max="8"
          step="0.5"
          value={settings.strokeWidth}
          onChange={(e) => updateSetting('strokeWidth', parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      {/* 位置 */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>位置</label>
        <select
          value={settings.position}
          onChange={(e) => updateSetting('position', e.target.value as StyleSettings['position'])}
          style={selectStyle}
        >
          <option value="bottom">下部</option>
          <option value="center">中央</option>
          <option value="top">上部</option>
        </select>
      </div>

      {/* Y オフセット */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>Y オフセット: {settings.yOffset}px</label>
        <input
          type="range"
          min="-200"
          max="200"
          value={settings.yOffset}
          onChange={(e) => updateSetting('yOffset', parseInt(e.target.value))}
          style={sliderStyle}
        />
      </div>

      {/* アニメーション */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>アニメーション</label>
        <select
          value={settings.animationStyle}
          onChange={(e) => updateSetting('animationStyle', e.target.value as StyleSettings['animationStyle'])}
          style={selectStyle}
        >
          <option value="fade">フェード</option>
          <option value="slide">スライド</option>
          <option value="scale">スケール</option>
          <option value="bounce">バウンス</option>
        </select>
      </div>

      {/* アニメーション速度 */}
      <div style={controlGroupStyle}>
        <label style={labelStyle}>アニメーション速度: {settings.fadeSpeed.toFixed(1)}s</label>
        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={settings.fadeSpeed}
          onChange={(e) => updateSetting('fadeSpeed', parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>
    </div>
  );
};