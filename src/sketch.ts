import p5 from 'p5';

export const sketch = (p: p5) => {
  console.log('🎨 Fractal sketch starting!');

  // Audio variables
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let dataArray: Uint8Array;
  let micLevel = 0;
  let audioInitialized = false;

  // Fractal variables
  let mandelbrotShader: p5.Shader;
  let zoom = 1;
  let centerX = -0.5;
  let centerY = 0;
  let time = 0;

  p.preload = () => {
    // Vertex shader (simple passthrough)
    const vertSource = `
      attribute vec3 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vTexCoord;
      
      void main() {
        vTexCoord = aTexCoord;
        gl_Position = vec4(aPosition, 1.0);
      }
    `;

    // Fragment shader (Mandelbrot fractal)
    const fragSource = `
      precision mediump float;
      varying vec2 vTexCoord;
      
      uniform vec2 uResolution;
      uniform float uZoom;
      uniform vec2 uCenter;
      uniform float uTime;
      uniform float uAudioLevel;
      uniform float uMaxIterations;
      
      // HSV to RGB conversion
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        // Map screen coordinates to complex plane
        vec2 uv = (vTexCoord * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
        vec2 c = uv / uZoom + uCenter;
        
        // Mandelbrot iteration
        vec2 z = vec2(0.0);
        float iterations = 0.0;
        
        for(int i = 0; i < 200; i++) {
          if(dot(z, z) > 4.0) break;
          z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
          iterations += 1.0;
          if(iterations >= uMaxIterations) break;
        }
        
        // Color based on iterations and audio
        float t = iterations / uMaxIterations;
        
        if(iterations >= uMaxIterations) {
          // Inside the set - dark with audio-reactive brightness
          gl_FragColor = vec4(vec3(uAudioLevel * 0.3), 1.0);
        } else {
          // Outside the set - colorful with audio-reactive hue
          float hue = t * 6.0 + uTime * 0.1 + uAudioLevel * 2.0;
          float saturation = 0.7 + uAudioLevel * 0.3;
          float brightness = 0.5 + t * 0.5 + uAudioLevel * 0.3;
          
          vec3 color = hsv2rgb(vec3(hue, saturation, brightness));
          gl_FragColor = vec4(color, 1.0);
        }
      }
    `;

    mandelbrotShader = p.createShader(vertSource, fragSource);
  };

  p.setup = () => {
    console.log('🚀 Setting up fractal canvas...');

    try {
      // Create full window canvas
      p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
      console.log('✅ WebGL canvas created:', p.width, 'x', p.height);

      console.log('✅ Fractal setup complete!');

      // Initialize audio
      setTimeout(initAudio, 100);
    } catch (error) {
      console.error('❌ Error in setup:', error);
    }
  };

  const initAudio = async () => {
    console.log('🎤 Initializing Web Audio API...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted!');

      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioInitialized = true;
      console.log('🔊 Audio + Fractal system ready! Try whistling!');

    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      console.log('ℹ️ Fractal will work without audio');
    }
  };

  const getAudioData = () => {
    if (!audioInitialized || !analyser) return;

    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    micLevel = sum / (dataArray.length * 255);
  };

  p.draw = () => {
    try {
      getAudioData();
      time += 0.016; // ~60fps timing

      // Audio-reactive fractal parameters
      const audioZoom = audioInitialized ? 1 + micLevel * 3 : 1;
      const audioIterations = audioInitialized ? 80 + micLevel * 120 : 100;

      // Apply shader
      p.shader(mandelbrotShader);

      // Set uniforms
      mandelbrotShader.setUniform('uResolution', [p.width, p.height]);
      mandelbrotShader.setUniform('uZoom', zoom * audioZoom);
      mandelbrotShader.setUniform('uCenter', [centerX, centerY]);
      mandelbrotShader.setUniform('uTime', time);
      mandelbrotShader.setUniform('uAudioLevel', micLevel);
      mandelbrotShader.setUniform('uMaxIterations', audioIterations);

      // Draw full-screen triangle strip (more efficient than quad)
      p.beginShape(p.TRIANGLE_STRIP);
      p.vertex(-1, -1, 0, 0, 0);  // bottom-left
      p.vertex(1, -1, 0, 1, 0);  // bottom-right  
      p.vertex(-1, 1, 0, 0, 1);  // top-left
      p.vertex(1, 1, 0, 1, 1);  // top-right
      p.endShape();

      // Reset for UI overlay
      p.resetShader();

      // UI overlay
      if (audioInitialized) {
        // Volume indicator
        p.fill(255, 200);
        p.rect(-p.width / 2 + 10, -p.height / 2 + 10, 200, 15);
        p.fill(255, 100, 100);
        p.rect(-p.width / 2 + 10, -p.height / 2 + 10, micLevel * 200, 15);

        p.fill(255);
        p.textAlign(p.LEFT);
        p.text(`🎤 Audio: ${(micLevel * 100).toFixed(1)}% | Zoom: ${(zoom * audioZoom).toFixed(2)}x`,
          -p.width / 2 + 10, -p.height / 2 + 40);

        if (micLevel > 0.05) {
          p.text('🎵 Fractal reacting to sound!', -p.width / 2 + 10, -p.height / 2 + 55);
        }
      } else {
        p.fill(255, 100, 100);
        p.textAlign(p.LEFT);
        p.text('🎤 Click to enable microphone', -p.width / 2 + 10, -p.height / 2 + 30);
      }

    } catch (error) {
      console.error('❌ Error in draw:', error);
    }
  };

  // Mouse interactions
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  p.mousePressed = () => {
    if (!audioInitialized) {
      initAudio();
    } else {
      isDragging = true;
      lastMouseX = p.mouseX;
      lastMouseY = p.mouseY;
    }
  };

  p.mouseReleased = () => {
    isDragging = false;
  };

  p.mouseDragged = () => {
    if (isDragging) {
      const dx = (p.mouseX - lastMouseX) / p.width;
      const dy = (p.mouseY - lastMouseY) / p.height;

      centerX -= dx / zoom;
      centerY += dy / zoom;

      lastMouseX = p.mouseX;
      lastMouseY = p.mouseY;
    }
  };

  p.mouseWheel = (event: any) => {
    const zoomFactor = event.delta > 0 ? 0.9 : 1.1;
    zoom *= zoomFactor;
    zoom = Math.max(0.1, Math.min(zoom, 1000));
    return false; // Prevent page scroll
  };

  p.keyPressed = () => {
    if (p.key === 'r' || p.key === 'R') {
      // Reset view
      zoom = 1;
      centerX = -0.5;
      centerY = 0;
      console.log('🔄 View reset');
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
}; 