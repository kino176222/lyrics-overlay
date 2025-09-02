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
}

export interface SimpleStyleControlsProps {
  settings: StyleSettings;
  onSettingsChange: (settings: StyleSettings) => void;
}

export const SimpleStyleControls: React.FC<SimpleStyleControlsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const updateSetting = <K extends keyof StyleSettings>(
    key: K,
    value: StyleSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const adjustNumber = (key: keyof StyleSettings, delta: number, min = 0, max = 999) => {
    const current = settings[key] as number;
    const newValue = Math.min(max, Math.max(min, current + delta));
    updateSetting(key, newValue as any);
  };

  const buttonStyle = {
    width: '32px',
    height: '32px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const inputStyle = {
    backgroundColor: '#444',
    color: '#fff',
    border: '1px solid #666',
    borderRadius: '4px',
    padding: '8px',
    width: '100px',
    textAlign: 'center' as const
  };

  const labelStyle = {
    color: '#fff',
    fontSize: '14px',
    marginBottom: '8px',
    display: 'block'
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  };

  const sectionStyle = {
    marginBottom: '24px'
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#333', 
      borderRadius: '8px',
      color: '#fff'
    }}>
      {/* フォント設定 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📝 フォント</label>
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          style={inputStyle}
        >
          <option value="'Shippori Mincho', 'しっぽり明朝', serif">しっぽり明朝</option>
          <option value="'Noto Sans JP', 'ヒラギノ角ゴ ProN', sans-serif">Noto Sans JP</option>
          <option value="'M PLUS 1p', sans-serif">M PLUS 1p</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="'Courier New', monospace">Courier New</option>
        </select>
      </div>

      {/* フォントサイズ */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📏 サイズ: {settings.fontSize}px</label>
        <div style={rowStyle}>
          <button style={buttonStyle} onClick={() => adjustNumber('fontSize', -2, 12, 120)}>-</button>
          <input 
            type="number" 
            value={settings.fontSize} 
            onChange={(e) => updateSetting('fontSize', parseInt(e.target.value) || 24)}
            style={inputStyle}
            min="12"
            max="120"
          />
          <button style={buttonStyle} onClick={() => adjustNumber('fontSize', 2, 12, 120)}>+</button>
        </div>
      </div>

      {/* フォント色 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>🎨 フォント色</label>
        <div style={rowStyle}>
          <input 
            type="color" 
            value={settings.fontColor} 
            onChange={(e) => updateSetting('fontColor', e.target.value)}
            style={{ width: '50px', height: '32px' }}
          />
          <input 
            type="text" 
            value={settings.fontColor} 
            onChange={(e) => updateSetting('fontColor', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ストローク */}
      <div style={sectionStyle}>
        <label style={labelStyle}>✏️ ストローク色</label>
        <div style={rowStyle}>
          <input 
            type="color" 
            value={settings.strokeColor} 
            onChange={(e) => updateSetting('strokeColor', e.target.value)}
            style={{ width: '50px', height: '32px' }}
          />
          <input 
            type="text" 
            value={settings.strokeColor} 
            onChange={(e) => updateSetting('strokeColor', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ストローク幅 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📐 ストローク幅: {settings.strokeWidth}px</label>
        <div style={rowStyle}>
          <button style={buttonStyle} onClick={() => adjustNumber('strokeWidth', -0.5, 0, 10)}>-</button>
          <input 
            type="number" 
            value={settings.strokeWidth} 
            onChange={(e) => updateSetting('strokeWidth', parseFloat(e.target.value) || 0)}
            style={inputStyle}
            step="0.5"
            min="0"
            max="10"
          />
          <button style={buttonStyle} onClick={() => adjustNumber('strokeWidth', 0.5, 0, 10)}>+</button>
        </div>
      </div>

      {/* 位置 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📍 位置</label>
        <div style={rowStyle}>
          {['top', 'center', 'bottom'].map(pos => (
            <button
              key={pos}
              onClick={() => updateSetting('position', pos as any)}
              style={{
                ...buttonStyle,
                width: 'auto',
                padding: '8px 16px',
                backgroundColor: settings.position === pos ? '#4CAF50' : '#666'
              }}
            >
              {pos === 'top' ? '上' : pos === 'center' ? '中央' : '下'}
            </button>
          ))}
        </div>
      </div>

      {/* Y軸オフセット */}
      <div style={sectionStyle}>
        <label style={labelStyle}>↕️ Y位置調整: {settings.yOffset}px</label>
        <div style={rowStyle}>
          <button style={buttonStyle} onClick={() => adjustNumber('yOffset', -5, -200, 200)}>-</button>
          <input 
            type="number" 
            value={settings.yOffset} 
            onChange={(e) => updateSetting('yOffset', parseInt(e.target.value) || 0)}
            style={inputStyle}
            min="-200"
            max="200"
          />
          <button style={buttonStyle} onClick={() => adjustNumber('yOffset', 5, -200, 200)}>+</button>
        </div>
      </div>

      {/* アニメーション */}
      <div style={sectionStyle}>
        <label style={labelStyle}>✨ アニメーション</label>
        <select
          value={settings.animationStyle}
          onChange={(e) => updateSetting('animationStyle', e.target.value as any)}
          style={inputStyle}
        >
          <option value="fade">フェード</option>
          <option value="slide">スライド</option>
          <option value="scale">スケール</option>
          <option value="bounce">バウンス</option>
        </select>
      </div>

      {/* フェードスピード */}
      <div style={sectionStyle}>
        <label style={labelStyle}>⚡ スピード: {settings.fadeSpeed}s</label>
        <div style={rowStyle}>
          <button style={buttonStyle} onClick={() => adjustNumber('fadeSpeed', -0.1, 0.1, 3)}>-</button>
          <input 
            type="number" 
            value={settings.fadeSpeed} 
            onChange={(e) => updateSetting('fadeSpeed', parseFloat(e.target.value) || 0.5)}
            style={inputStyle}
            step="0.1"
            min="0.1"
            max="3"
          />
          <button style={buttonStyle} onClick={() => adjustNumber('fadeSpeed', 0.1, 0.1, 3)}>+</button>
        </div>
      </div>
    </div>
  );
};