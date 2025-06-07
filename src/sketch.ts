import p5 from 'p5';

export const sketch = (p: p5) => {
  console.log('🎨 Flowing Fractal sketch starting!');

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

    // Enhanced fragment shader with flowing movement and smooth colors
    const fragSource = `
      precision mediump float;
      varying vec2 vTexCoord;
      
      uniform vec2 uResolution;
      uniform float uZoom;
      uniform vec2 uCenter;
      uniform float uTime;
      uniform float uAudioLevel;
      uniform float uMaxIterations;
      
      // Improved color palette function for smoother transitions
      vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
        return a + b * cos(6.28318 * (c * t + d));
      }
      
      // Smooth HSV to RGB with better blending
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      // Smooth step function for better color transitions
      float smootherStep(float edge0, float edge1, float x) {
        x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
      }
      
      void main() {
        // Map screen coordinates with flowing distortion
        vec2 uv = (vTexCoord * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
        
        // Add subtle organic movement even without audio
        float baseFlow = sin(uTime * 0.3) * 0.02;
        float flowX = sin(uTime * 0.2 + uv.y * 2.0) * 0.03;
        float flowY = cos(uTime * 0.25 + uv.x * 1.5) * 0.03;
        
        // Audio enhances the movement
        float audioFlow = uAudioLevel * 0.1;
        flowX += sin(uTime * 2.0 + uAudioLevel * 10.0) * audioFlow;
        flowY += cos(uTime * 1.7 + uAudioLevel * 8.0) * audioFlow;
        
        // Apply flowing distortion
        uv.x += flowX + baseFlow;
        uv.y += flowY + sin(uTime * 0.4) * 0.02;
        
        // Dynamic zoom with breathing effect
        float breathingZoom = 1.0 + sin(uTime * 0.5) * 0.1;
        float audioZoom = 1.0 + uAudioLevel * 2.0;
        vec2 c = uv / (uZoom * breathingZoom * audioZoom) + uCenter;
        
        // Add rotation over time
        float angle = uTime * 0.1 + uAudioLevel * 0.5;
        float cosA = cos(angle);
        float sinA = sin(angle);
        c = vec2(c.x * cosA - c.y * sinA, c.x * sinA + c.y * cosA);
        
        // Mandelbrot iteration with dynamic escape radius
        vec2 z = vec2(0.0);
        float iterations = 0.0;
        float escapeRadius = 4.0 + sin(uTime * 0.3) * 1.0;
        
        for(int i = 0; i < 200; i++) {
          if(dot(z, z) > escapeRadius) break;
          
          // Add slight variation to the iteration formula for organic movement
          float variation = sin(uTime * 0.7 + float(i) * 0.1) * 0.01;
          z = vec2(z.x * z.x - z.y * z.y + variation, 2.0 * z.x * z.y) + c;
          
          iterations += 1.0;
          if(iterations >= uMaxIterations) break;
        }
        
        // Smooth iteration value for better color gradients
        if(iterations < uMaxIterations) {
          float zr = length(z);
          iterations += 1.0 - log2(log2(zr));
        }
        
        float t = iterations / uMaxIterations;
        
        if(iterations >= uMaxIterations) {
          // Inside the set - flowing dark colors with subtle audio-reactive brightness
          float innerGlow = sin(uTime * 0.8 + length(c) * 10.0) * 0.5 + 0.5;
          vec3 innerColor = vec3(0.1, 0.05, 0.2) * (1.0 + uAudioLevel * 0.5);
          innerColor += vec3(0.0, 0.1, 0.3) * innerGlow * 0.3;
          gl_FragColor = vec4(innerColor, 1.0);
        } else {
          // Outside the set - flowing rainbow colors
          
          // Multiple color layers for richness
          float timeOffset = uTime * 0.2;
          float audioOffset = uAudioLevel * 3.0;
          
          // Primary color wave
          float hue1 = t * 2.0 + timeOffset + audioOffset + sin(uTime * 0.3) * 0.5;
          // Secondary color wave for blending
          float hue2 = t * 1.5 + timeOffset * 1.3 + sin(uTime * 0.4 + 1.0) * 0.7;
          
          // Color palette using cosine-based interpolation for smooth gradients
          vec3 color1 = palette(hue1, 
            vec3(0.5, 0.5, 0.5),  // base
            vec3(0.5, 0.5, 0.5),  // amplitude  
            vec3(1.0, 1.0, 1.0),  // frequency
            vec3(0.0, 0.33, 0.67) // phase
          );
          
          vec3 color2 = palette(hue2,
            vec3(0.5, 0.5, 0.5),
            vec3(0.5, 0.5, 0.5), 
            vec3(1.0, 1.0, 0.5),
            vec3(0.8, 0.9, 0.3)
          );
          
          // Blend the two color layers
          float blendFactor = sin(uTime * 0.6 + t * 8.0) * 0.5 + 0.5;
          vec3 blendedColor = mix(color1, color2, blendFactor * 0.4);
          
          // Add brightness variation with smooth gradients
          float brightness = smootherStep(0.0, 1.0, t);
          brightness = 0.3 + brightness * 0.7;
          brightness += uAudioLevel * 0.4;
          brightness += sin(uTime * 0.5 + t * 10.0) * 0.1;
          
          // Saturation varies over time for organic feeling
          float saturation = 0.7 + sin(uTime * 0.4 + t * 5.0) * 0.2;
          saturation += uAudioLevel * 0.3;
          
          // Final color composition
          vec3 finalColor = blendedColor * brightness;
          
          // Add subtle color shifting over time
          finalColor.r += sin(uTime * 0.7 + t * 3.0) * 0.1;
          finalColor.g += sin(uTime * 0.8 + t * 4.0 + 2.0) * 0.1;
          finalColor.b += sin(uTime * 0.9 + t * 5.0 + 4.0) * 0.1;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      }
    `;

    mandelbrotShader = p.createShader(vertSource, fragSource);
  };

  p.setup = () => {
    console.log('🚀 Setting up flowing fractal canvas...');

    try {
      // Create full window canvas
      p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
      console.log('✅ WebGL canvas created:', p.width, 'x', p.height);

      console.log('✅ Flowing fractal setup complete!');

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
      console.log('🔊 Audio + Flowing Fractal system ready! Try whistling!');

    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      console.log('ℹ️ Fractal will flow beautifully without audio too!');
    }
  };

  const getAudioData = () => {
    if (!audioInitialized || !analyser) return;

    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume level with smoothing
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const newLevel = sum / (dataArray.length * 255);

    // Smooth the audio level for less jarring transitions
    micLevel = micLevel * 0.8 + newLevel * 0.2;
  };

  p.draw = () => {
    try {
      getAudioData();
      time += 0.016; // ~60fps timing

      // Dynamic parameters that evolve over time
      const timeVaryingZoom = 1.0 + Math.sin(time * 0.3) * 0.2;
      const audioZoom = audioInitialized ? 1 + micLevel * 1.5 : 1;
      const audioIterations = audioInitialized ? 100 + micLevel * 50 : 120;

      // Slowly shift the center point for gentle movement
      const centerDrift = 0.0001;
      centerX += Math.sin(time * 0.1) * centerDrift;
      centerY += Math.cos(time * 0.13) * centerDrift;

      // Apply shader
      p.shader(mandelbrotShader);

      // Set uniforms
      mandelbrotShader.setUniform('uResolution', [p.width, p.height]);
      mandelbrotShader.setUniform('uZoom', zoom * timeVaryingZoom * audioZoom);
      mandelbrotShader.setUniform('uCenter', [centerX, centerY]);
      mandelbrotShader.setUniform('uTime', time);
      mandelbrotShader.setUniform('uAudioLevel', micLevel);
      mandelbrotShader.setUniform('uMaxIterations', audioIterations);

      // Draw full-screen triangle strip
      p.beginShape(p.TRIANGLE_STRIP);
      p.vertex(-1, -1, 0, 0, 0);  // bottom-left
      p.vertex(1, -1, 0, 1, 0);  // bottom-right  
      p.vertex(-1, 1, 0, 0, 1);  // top-left
      p.vertex(1, 1, 0, 1, 1);  // top-right
      p.endShape();

      // Reset for UI overlay
      p.resetShader();

      // Minimalist UI overlay
      if (audioInitialized) {
        // Subtle volume indicator
        p.fill(255, 100);
        p.rect(-p.width / 2 + 10, -p.height / 2 + 10, 150, 8);
        p.fill(255, 200, 100, 200);
        p.rect(-p.width / 2 + 10, -p.height / 2 + 10, micLevel * 150, 8);

        if (micLevel > 0.05) {
          p.fill(255, 150);
          p.textAlign(p.LEFT);
          p.text('🎵 Audio enhancing the flow', -p.width / 2 + 10, -p.height / 2 + 35);
        }
      } else {
        p.fill(255, 120);
        p.textAlign(p.LEFT);
        p.text('🎤 Click to add audio reactivity', -p.width / 2 + 10, -p.height / 2 + 25);
        p.text('✨ Fractal flows on its own!', -p.width / 2 + 10, -p.height / 2 + 45);
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
    const zoomFactor = event.delta > 0 ? 0.95 : 1.05;
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
      console.log('🔄 View reset - flow continues');
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
}; 