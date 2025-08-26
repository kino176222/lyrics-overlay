# 🎬 Lyrics Overlay Generator

Automatically generate transparent lyrics overlay videos for Final Cut Pro using Remotion and React.

## ✨ Features

- 🎵 Auto-sync lyrics with MP3 files
- 🎨 Three editing interfaces (Simple, Visual, Studio)
- 🎥 ProRes 4444 output with alpha channel
- 🚀 Batch processing support
- 📱 Responsive browser-based tools

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/lyrics-overlay.git
cd lyrics-overlay

# Install dependencies
npm install

# Start Remotion Studio
npm start
```

## 📖 Usage

### Method 1: Simple Generator (Easiest)
```bash
open src/simple-generator.html
```
1. Drag & drop your MP3
2. Enter lyrics (one per line)
3. Click "Generate Video"

### Method 2: Visual Editor (Intermediate)
```bash
open src/visual-editor.html
```
- Timeline-based editing
- Real-time preview
- Drag to adjust timing

### Method 3: Remotion Studio (Advanced)
```bash
npm start
```
- Full code control
- Professional features
- Unlimited customization

## 📁 Project Structure

```
├── src/
│   ├── compositions/      # Video components
│   ├── lyrics-data.json   # Lyrics timing data
│   ├── simple-generator.html
│   └── visual-editor.html
├── public/
│   └── audio.mp3          # Your music file
├── scripts/
│   └── generate-lyrics.js # CLI generator
└── out/                   # Video output
```

## 🎥 Generate Video

```bash
# With audio and transparency
npm run build:with-audio

# Transparency only
npm run build:transparent

# From text file
node scripts/generate-lyrics.js lyrics.txt 180
```

## 🎨 Customization

Edit `src/compositions/LyricsOverlay.tsx`:

```javascript
// Font size
fontSize: '60px'

// Position
bottom: '150px'

// Colors
color: 'white'
backgroundColor: 'rgba(0, 0, 0, 0.7)'
```

## 📋 Requirements

- Node.js 16+
- npm or yarn
- Final Cut Pro (for video editing)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 📝 License

MIT

## 🙏 Acknowledgments

- [Remotion](https://www.remotion.dev/) - React for videos
- Built with React and TypeScript

---

Made with ❤️ for video creators