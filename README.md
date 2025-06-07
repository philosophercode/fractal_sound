# 🌀🎵 Fractal Sound

An interactive, real-time audio-reactive Mandelbrot fractal visualization that responds to your voice, music, and ambient sound.

![Fractal Sound Demo](https://img.shields.io/badge/WebGL-Audio%20Reactive-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue) ![p5.js](https://img.shields.io/badge/p5.js-WebGL-orange)

## ✨ Features

🎤 **Live Audio Reactivity** - Fractal responds in real-time to microphone input  
🌈 **Dynamic Colors** - Hue shifts and brightness changes with sound amplitude  
🔍 **Interactive Zoom/Pan** - Mouse controls for exploring the fractal  
⚡ **GPU Accelerated** - WebGL shaders for smooth 60fps rendering  
📱 **Responsive Design** - Works on desktop and mobile browsers  
🎨 **Mathematical Beauty** - Real Mandelbrot set computation  

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd fractal-sound

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` and **allow microphone access** when prompted.

## 🎮 Controls

### Audio
- **Whistle or speak** - Watch the fractal react with size and color changes
- **Play music** - See rhythmic visual responses to beats and melodies
- **Click anywhere** - Enable microphone if permission wasn't granted

### Navigation  
- **Mouse drag** - Pan around the fractal
- **Mouse wheel** - Zoom in/out to explore infinite detail
- **Press 'R'** - Reset view to default position

## 🛠️ Technology Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **p5.js** - Creative coding framework with WebGL support
- **Web Audio API** - Real-time audio analysis
- **GLSL Shaders** - GPU-accelerated fractal computation

## 📁 Project Structure

```
fractal-sound/
├── src/
│   ├── main.ts           # Entry point
│   ├── sketch.ts         # Main p5.js sketch with fractal and audio
│   └── components/       # (Future modular components)
├── index.html            # HTML shell
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Build configuration
└── README.md            # This file
```

## 🎨 How It Works

1. **Audio Capture**: Uses Web Audio API to capture microphone input
2. **Signal Analysis**: Calculates amplitude (volume) from audio stream  
3. **Fractal Generation**: Custom GLSL fragment shader computes Mandelbrot set
4. **Audio Modulation**: Sound amplitude controls:
   - Fractal zoom level (breathing effect)
   - Color hue and saturation
   - Iteration count (detail level)
   - Overall brightness

## 🔬 The Mathematics

The visualization renders the famous **Mandelbrot set** defined by:

```glsl
z = z² + c
```

Where:
- `z` starts at (0,0) 
- `c` is the complex coordinate of each pixel
- Points that don't escape to infinity (after max iterations) are in the set
- Escape time determines color and brightness

## 🎵 Audio Processing

- **Real-time FFT analysis** of microphone input
- **Volume detection** via RMS amplitude calculation
- **Frequency analysis** for future spectrum-based effects
- **Smooth interpolation** prevents jarring visual changes

## 🚧 Future Enhancements

- [ ] **Multiple Fractal Types** (Julia sets, Burning Ship, Newton fractals)
- [ ] **Spectrum Analysis** - Colors react to different frequency ranges
- [ ] **Audio File Upload** - Visualize music files directly
- [ ] **Preset System** - Save and load favorite configurations
- [ ] **Performance Mode** - Optimizations for lower-end devices
- [ ] **Recording/Export** - Save video or high-res images
- [ ] **VR/AR Support** - Immersive fractal experiences

## 🎯 Performance Notes

- **60fps target** on modern hardware
- **WebGL required** - falls back gracefully if unavailable
- **Optimized shaders** - efficient GPU computation
- **Responsive scaling** - adjusts to screen resolution

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Additional fractal algorithms
- Audio analysis improvements  
- Mobile optimization
- New visual effects
- Performance enhancements

## 📄 License

MIT License - Feel free to use, modify, and distribute!

## 🙏 Acknowledgments

- **Benoit Mandelbrot** - For discovering this mathematical marvel
- **p5.js Community** - For the amazing creative coding framework
- **Web Audio API** - For making real-time audio processing accessible

---

**Made with ❤️ and mathematics** 