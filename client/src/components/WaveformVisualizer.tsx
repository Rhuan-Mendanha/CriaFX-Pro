import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';

interface WaveformVisualizerProps {
  frequencyData: Uint8Array;
  isPlaying: boolean;
  tracksCount: number;
}

const DARK_BG_PALETTE = [
  { r: 30, g: 0, b: 25 }, { r: 25, g: 0, b: 30 }, { r: 35, g: 10, b: 30 },
  { r: 40, g: 0, b: 35 }, { r: 25, g: 5, b: 20 }, { r: 30, g: 8, b: 25 },
];

const LIGHT_BG_PALETTE = [
  { r: 224, g: 245, b: 245 }, { r: 225, g: 245, b: 255 }, { r: 230, g: 250, b: 240 },
  { r: 220, g: 255, b: 240 }, { r: 230, g: 255, b: 230 }, { r: 235, g: 250, b: 245 },
];

export function WaveformVisualizer({ frequencyData, isPlaying, tracksCount }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const smoothedRef = useRef<Float32Array>(new Float32Array(0));
  const energyTransitionRef = useRef(0);
  const { theme } = useTheme();
  const { visualizerStyle, darkModeColors, lightModeColors } = useSettings();

  const freqRef = useRef(frequencyData);
  const playingRef = useRef(isPlaying);
  const tracksCountRef = useRef(tracksCount);
  const themeRef = useRef(theme);
  const styleRef = useRef(visualizerStyle);
  const bgStateRef = useRef({
    current: { r: 0, g: 0, b: 0 },
    target: { r: 0, g: 20, b: 40 },
    colorIndex: 0,
    timer: 0,
  });

  // Update refs to avoid dependency re-runs
  freqRef.current = frequencyData;
  playingRef.current = isPlaying;
  tracksCountRef.current = tracksCount;
  themeRef.current = theme;
  styleRef.current = visualizerStyle;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const isDark = themeRef.current === 'dark';
      const freq = freqRef.current;
      const playing = playingRef.current;
      const hasMusic = tracksCountRef.current > 0;
      const style = styleRef.current;
      const waveColors = isDark ? darkModeColors.colors : lightModeColors.colors;
      const bgPalette = isDark ? DARK_BG_PALETTE : LIGHT_BG_PALETTE;

      if (smoothedRef.current.length !== freq.length) {
        smoothedRef.current = new Float32Array(freq.length);
      }

      // Clear canvas
      ctx.fillStyle = isDark ? 'rgb(10,10,18)' : 'rgb(240,240,242)';
      ctx.fillRect(0, 0, W, H);

      let bass = 0, mid = 0, high = 0;
      let targetTransition = 0;

      if (playing && hasMusic && freq.length > 0) {
        const smoothed = smoothedRef.current;
        for (let i = 0; i < freq.length; i++) {
          smoothed[i] = smoothed[i] * 0.75 + freq[i] * 0.25;
        }

        const bassEnd = Math.floor(smoothed.length * 0.15);
        const midEnd = Math.floor(smoothed.length * 0.50);
        const highEnd = Math.floor(smoothed.length * 0.85);

        let bassSum = 0, midSum = 0, highSum = 0;
        for (let i = 0; i < bassEnd; i++) bassSum += smoothed[i];
        for (let i = bassEnd; i < midEnd; i++) midSum += smoothed[i];
        for (let i = midEnd; i < highEnd; i++) highSum += smoothed[i];

        bass = (bassSum / (bassEnd || 1)) / 255;
        mid = (midSum / (midEnd - bassEnd || 1)) / 255;
        high = (highSum / (highEnd - midEnd || 1)) / 255;

        targetTransition = 1.0;

        const bg = bgStateRef.current;
        bg.timer += 1;
        if (bass > 0.6 && bg.timer > 30) {
          bg.colorIndex = (bg.colorIndex + 1) % bgPalette.length;
          bg.target = bgPalette[bg.colorIndex];
          bg.timer = 0;
        }
        bg.current.r += (bg.target.r - bg.current.r) * 0.03;
        bg.current.g += (bg.target.g - bg.current.g) * 0.03;
        bg.current.b += (bg.target.b - bg.current.b) * 0.03;

        const pulse = 0.12 + bass * 0.35;
        const { r, g, b } = bg.current;
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        bgGrad.addColorStop(0, `rgba(${r},${g},${b},${pulse})`);
        bgGrad.addColorStop(0.6, `rgba(${r},${g},${b},${pulse * 0.4})`);
        bgGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
      } else {
        targetTransition = 0;
        const slowPulse = 0.06 + Math.sin(timeRef.current * 0.002) * 0.03;
        const bgIndex = Math.floor(timeRef.current / 600) % bgPalette.length;
        const bgTarget = bgPalette[bgIndex];
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        bgGrad.addColorStop(0, `rgba(${bgTarget.r},${bgTarget.g},${bgTarget.b},${slowPulse})`);
        bgGrad.addColorStop(0.6, `rgba(${bgTarget.r},${bgTarget.g},${bgTarget.b},${slowPulse * 0.4})`);
        bgGrad.addColorStop(1, `rgba(${bgTarget.r},${bgTarget.g},${bgTarget.b},0)`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
      }

      energyTransitionRef.current = targetTransition;
      const transition = energyTransitionRef.current;

      // Drawing functions (Original logic preserved)
      if (style === 'flowing-waves') {
        drawFlowingWaves(ctx, W, H, waveColors, transition, bass, mid, high);
      } else if (style === 'frequency-bars') {
        drawFrequencyBars(ctx, W, H, waveColors, transition, smoothedRef.current);
      } else if (style === 'spiral') {
        drawSpiral(ctx, W, H, waveColors, transition, bass, mid);
      } else if (style === 'particle-field') {
        drawParticleField(ctx, W, H, waveColors, transition, bass, high);
      } else if (style === 'waveform') {
        drawWaveform(ctx, W, H, waveColors, transition, smoothedRef.current, bass, mid, high);
      }

      ctx.shadowBlur = 0;
      const isActive = playing && hasMusic;
      const speedMultiplier = isActive ? 1.0 : 0.3;
      timeRef.current += speedMultiplier;
      
      rafRef.current = requestAnimationFrame(animate);
    };

    // --- Original Drawing Functions ---
    function drawFlowingWaves(ctx: CanvasRenderingContext2D, W: number, H: number, colors: any[], t: number, bass: number, mid: number, high: number) {
      const centerY = H / 2;
      const WAVES = 8;
      const spacing = 40;
      const baseSpeed = 0.003 + t * 0.012;
      const bassVerticalOffset = bass * t * 80;

      for (let wi = WAVES - 1; wi >= 0; wi--) {
        const staticOffset = (wi - WAVES / 2) * spacing;
        const bandEnergy = wi < 3 ? bass : wi < 6 ? mid : high;
        const waveVerticalOffset = bandEnergy * t * 60 * (wi < 4 ? 1 : -1);
        const yOffset = staticOffset + waveVerticalOffset + (wi < 4 ? bassVerticalOffset : -bassVerticalOffset);
        const c = colors[wi % colors.length];
        const nextC = colors[(wi + 1) % colors.length];
        const baseAmp = 50;
        const amp = baseAmp * (0.2 + t * (0.5 + bandEnergy * 0.8));
        const opacity = 0.75 - wi * 0.06;
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${opacity})`);
        grad.addColorStop(0.5, `rgba(${nextC.rgb[0]},${nextC.rgb[1]},${nextC.rgb[2]},${opacity})`);
        grad.addColorStop(1, `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${opacity})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5 + bass * t * 2;
        ctx.shadowBlur = 8 + bandEnergy * t * 15;
        ctx.shadowColor = c.base;
        ctx.beginPath();
        const phase = timeRef.current * baseSpeed * (1 + wi * 0.1);
        for (let x = 0; x <= W; x += 2) {
          const xp = x * 0.007 + phase;
          const w1 = Math.sin(xp * 1.0 + wi * 0.7) * amp;
          const w2 = Math.sin(xp * 1.8 + wi * 0.9) * amp * 0.4;
          const w3 = Math.cos(xp * 0.6 + wi * 1.1) * amp * 0.25;
          const y = centerY + yOffset + w1 + w2 + w3;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineTo(W, centerY + yOffset);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const fillGrad = ctx.createLinearGradient(0, centerY + yOffset - amp, 0, H);
        fillGrad.addColorStop(0, `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${opacity * 0.25})`);
        fillGrad.addColorStop(0.4, `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${opacity * 0.1})`);
        fillGrad.addColorStop(1, `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},0)`);
        ctx.fillStyle = fillGrad;
        ctx.shadowBlur = 0;
        ctx.fill();
      }
    }

    function drawFrequencyBars(ctx: CanvasRenderingContext2D, W: number, H: number, colors: any[], t: number, smoothed: Float32Array) {
      const barCount = 64;
      const barWidth = (W / 2) / barCount;
      for (let i = 0; i < barCount; i++) {
        const step = Math.max(1, Math.floor(smoothed.length / barCount));
        const index = Math.min(i * step, smoothed.length - 1);
        const rawValue = smoothed[index] / 255;
        const value = rawValue * (0.1 + t * 0.9);
        const barHeight = value * H * 0.75;
        const colorIndex = Math.floor((i / barCount) * colors.length);
        const c = colors[colorIndex];
        const nextC = colors[(colorIndex + 1) % colors.length];
        const grad = ctx.createLinearGradient(0, H, 0, H - barHeight);
        grad.addColorStop(0, `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},0.2)`);
        grad.addColorStop(0.5, `rgba(${nextC.rgb[0]},${nextC.rgb[1]},${nextC.rgb[2]},0.75)`);
        grad.addColorStop(1, `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},0.55)`);
        ctx.fillStyle = grad;
        ctx.shadowBlur = 6 + value * t * 12;
        ctx.shadowColor = c.base;
        const r = Math.min(barWidth / 3, 5);
        const y = H - barHeight;
        const xLeft = i * barWidth;
        ctx.beginPath();
        ctx.moveTo(xLeft, H);
        ctx.lineTo(xLeft, y + r);
        ctx.arcTo(xLeft, y, xLeft + barWidth, y, r);
        ctx.lineTo(xLeft + barWidth, H);
        ctx.closePath();
        ctx.fill();
        const xRight = W - i * barWidth - barWidth;
        ctx.beginPath();
        ctx.moveTo(xRight, H);
        ctx.lineTo(xRight, y + r);
        ctx.arcTo(xRight, y, xRight + barWidth, y, r);
        ctx.lineTo(xRight + barWidth, H);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function drawSpiral(ctx: CanvasRenderingContext2D, W: number, H: number, colors: any[], t: number, bass: number, mid: number) {
      const cx = W / 2;
      const cy = H / 2;
      const spirals = 5;
      const baseSpeed = 0.002 + t * 0.008;
      const maxRadius = Math.min(W, H) * 0.48;
      for (let s = 0; s < spirals; s++) {
        const c = colors[s % colors.length];
        const energy = s < 2 ? bass : mid;
        ctx.strokeStyle = `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${0.7 + t * 0.2})`;
        ctx.lineWidth = 2 + energy * t * 5;
        ctx.shadowBlur = 10 + energy * t * 20;
        ctx.shadowColor = c.base;
        ctx.beginPath();
        const points = 300;
        for (let i = 0; i <= points; i++) {
          const progress = i / points;
          const angle = progress * Math.PI * 10 + timeRef.current * baseSpeed + s * Math.PI * 0.4;
          const radius = progress * maxRadius * (0.3 + t * (0.5 + energy * 0.4));
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    function drawParticleField(ctx: CanvasRenderingContext2D, W: number, H: number, colors: any[], t: number, bass: number, high: number) {
      // MIRRORED FREQUENCY BARS - Barras espelhadas superior/inferior (como na imagem!)
      const cx = W / 2;
      const cy = H / 2;
      
      // Energy com boa resposta
      const targetEnergy = (bass * 0.6 + high * 0.4) * t;
      energyTransitionRef.current += (targetEnergy - energyTransitionRef.current) * 0.15;
      const energy = energyTransitionRef.current;
      
      // Configuração das barras
      const barCount = 128; // Mais barras = mais detalhado
      const barWidth = W / barCount;
      const maxBarHeight = H * 0.45; // 45% da altura (para caber superior + inferior)
      
      // Criar array de frequências suavizado
      const smoothed = smoothedRef.current;
      if (smoothed.length === 0) return;
      
      // Desenhar barras
      for (let i = 0; i < barCount; i++) {
        // Pegar valor de frequência
        const freqIndex = Math.floor((i / barCount) * smoothed.length);
        const freqValue = (smoothed[freqIndex] || 0) / 255;
        
        // Altura da barra com energia
        const barHeight = freqValue * maxBarHeight * (0.3 + energy * 0.7);
        
        // Posição X da barra
        const x = i * barWidth;
        
        // Cor baseada na posição (arco-íris)
        const colorProgress = i / barCount;
        const colorIndex = Math.floor(colorProgress * colors.length);
        const c = colors[colorIndex % colors.length];
        const nextC = colors[(colorIndex + 1) % colors.length];
        
        // Mix de cores para transição suave
        const colorMix = (colorProgress * colors.length) % 1;
        const r = Math.floor(c.rgb[0] * (1 - colorMix) + nextC.rgb[0] * colorMix);
        const g = Math.floor(c.rgb[1] * (1 - colorMix) + nextC.rgb[1] * colorMix);
        const b = Math.floor(c.rgb[2] * (1 - colorMix) + nextC.rgb[2] * colorMix);
        
        // Intensidade baseada na frequência
        const intensity = 0.4 + freqValue * 0.6;
        
        // Gradiente vertical para cada barra
        const topGrad = ctx.createLinearGradient(x, cy - barHeight, x, cy);
        topGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
        topGrad.addColorStop(0.5, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${intensity * 0.9})`);
        topGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${intensity * 0.7})`);
        
        const bottomGrad = ctx.createLinearGradient(x, cy, x, cy + barHeight);
        bottomGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.7})`);
        bottomGrad.addColorStop(0.5, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${intensity * 0.9})`);
        bottomGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${intensity})`);
        
        // Barra SUPERIOR (para cima do centro)
        ctx.fillStyle = topGrad;
        ctx.fillRect(x, cy - barHeight, barWidth - 1, barHeight);
        
        // Barra INFERIOR (para baixo do centro) - ESPELHO
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(x, cy, barWidth - 1, barHeight);
        
        // Glow nas barras mais altas
        if (freqValue > 0.6) {
          ctx.shadowBlur = 8 + freqValue * 15;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${freqValue * 0.8})`;
          
          // Redesenhar com glow
          ctx.fillStyle = topGrad;
          ctx.fillRect(x, cy - barHeight, barWidth - 1, barHeight);
          
          ctx.fillStyle = bottomGrad;
          ctx.fillRect(x, cy, barWidth - 1, barHeight);
          
          ctx.shadowBlur = 0;
        }
      }
      
      // Linha central brilhante
      const centerLineGrad = ctx.createLinearGradient(0, cy - 2, W, cy + 2);
      colors.forEach((c: any, i: number) => {
        const progress = i / (colors.length - 1);
        centerLineGrad.addColorStop(progress, `rgba(${c.rgb[0] + 50}, ${c.rgb[1] + 50}, ${c.rgb[2] + 50}, ${0.6 + energy * 0.4})`);
      });
      
      ctx.fillStyle = centerLineGrad;
      ctx.shadowBlur = 10 + energy * 20;
      ctx.shadowColor = colors[0].base;
      ctx.fillRect(0, cy - 2, W, 4);
      ctx.shadowBlur = 0;
      
      // Partículas flutuantes nas pontas das barras (opcional, para mais dinamismo)
      if (energy > 0.5) {
        for (let i = 0; i < barCount; i += 4) { // A cada 4 barras
          const freqIndex = Math.floor((i / barCount) * smoothed.length);
          const freqValue = (smoothed[freqIndex] || 0) / 255;
          
          if (freqValue > 0.7) { // Só nas barras altas
            const x = i * barWidth + barWidth / 2;
            const barHeight = freqValue * maxBarHeight * (0.3 + energy * 0.7);
            
            const colorIndex = Math.floor((i / barCount) * colors.length);
            const c = colors[colorIndex % colors.length];
            
            // Partícula no topo da barra superior
            const particleSize = 3 + freqValue * 5;
            const particleGrad = ctx.createRadialGradient(x, cy - barHeight, 0, x, cy - barHeight, particleSize * 2);
            particleGrad.addColorStop(0, `rgba(255, 255, 255, ${freqValue})`);
            particleGrad.addColorStop(0.5, `rgba(${c.rgb[0] + 80}, ${c.rgb[1] + 80}, ${c.rgb[2] + 80}, ${freqValue * 0.8})`);
            particleGrad.addColorStop(1, `rgba(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]}, 0)`);
            
            ctx.fillStyle = particleGrad;
            ctx.beginPath();
            ctx.arc(x, cy - barHeight, particleSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Partícula no fundo da barra inferior (espelho)
            const particleGradBottom = ctx.createRadialGradient(x, cy + barHeight, 0, x, cy + barHeight, particleSize * 2);
            particleGradBottom.addColorStop(0, `rgba(255, 255, 255, ${freqValue})`);
            particleGradBottom.addColorStop(0.5, `rgba(${c.rgb[0] + 80}, ${c.rgb[1] + 80}, ${c.rgb[2] + 80}, ${freqValue * 0.8})`);
            particleGradBottom.addColorStop(1, `rgba(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]}, 0)`);
            
            ctx.fillStyle = particleGradBottom;
            ctx.beginPath();
            ctx.arc(x, cy + barHeight, particleSize * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    function drawRainbowRings(ctx: CanvasRenderingContext2D, W: number, H: number, colors: any[], t: number, mid: number, high: number) {
      const cx = W / 2;
      const cy = H / 2;
      const maxRadius = Math.min(W, H) * 0.45;
      const ringCount = 12;
      
      for (let i = 0; i < ringCount; i++) {
        const progress = i / ringCount;
        const radius = maxRadius * progress * (0.5 + t * 0.5);
        const colorIndex = Math.floor(progress * colors.length);
        const c = colors[colorIndex];
        const opacity = (1 - progress) * (0.3 + t * 0.4) * (0.5 + mid * 0.5);
        
        ctx.strokeStyle = `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${opacity})`;
        ctx.lineWidth = 2 + high * t * 4;
        ctx.shadowBlur = 8 + high * t * 15;
        ctx.shadowColor = c.base;
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
    }

    function drawWaveform(ctx: CanvasRenderingContext2D, W: number, H: number, colors: any[], t: number, smoothed: Float32Array, bass: number, mid: number, high: number) {
      const cy = H / 2;
      const baseSpeed = 0.003 + t * 0.012;
      const phase = timeRef.current * baseSpeed;
      
      ctx.lineWidth = 3 + bass * t * 3;
      ctx.shadowBlur = 15 + t * 15;
      
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      colors.forEach((c: any, i: number) => {
        grad.addColorStop(i / (colors.length - 1), `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${0.7 + t * 0.3})`);
      });
      ctx.strokeStyle = grad;
      ctx.shadowColor = colors[0].base;
      
      const points = Math.floor(W / 3);
      const step = Math.max(1, Math.floor(smoothed.length / points));
      
      // Top wave
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const x = (i / points) * W;
        const index = Math.min(i * step, smoothed.length - 1);
        const freqValue = (smoothed[index] / 255) * (0.15 + t * 0.85);
        const xp = x * 0.006 + phase;
        const baseWave = Math.sin(xp) * H * 0.2 * (0.3 + bass * t * 0.7);
        const freqWave = (freqValue - 0.5) * H * 0.35 * t;
        const detailWave = Math.sin(xp * 3) * H * 0.05 * mid * t;
        const y = cy + baseWave + freqWave + detailWave;
        
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Bottom wave (mirror)
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const x = (i / points) * W;
        const index = Math.min(i * step, smoothed.length - 1);
        const freqValue = (smoothed[index] / 255) * (0.15 + t * 0.85);
        const xp = x * 0.006 + phase;
        const baseWave = Math.sin(xp) * H * 0.2 * (0.3 + bass * t * 0.7);
        const freqWave = (freqValue - 0.5) * H * 0.35 * t;
        const detailWave = Math.sin(xp * 3) * H * 0.05 * mid * t;
        const y = cy - (baseWave + freqWave + detailWave);
        
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    
    // Start animation
    animate();
    console.log('WaveformVisualizer: Animation started');
    
    // Cleanup function
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('resize', resize);
      console.log('WaveformVisualizer: Cleanup complete');
    };
  }, [darkModeColors, lightModeColors]);

  useEffect(() => {
    const isDark = theme === 'dark';
    const palette = isDark ? DARK_BG_PALETTE : LIGHT_BG_PALETTE;
    bgStateRef.current = {
      current: { ...palette[0] },
      target: { ...palette[0] },
      colorIndex: 0,
      timer: 0,
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 5,
        pointerEvents: 'none',
        mixBlendMode: 'normal',
        opacity: 0.85,
        display: 'block',
        backgroundColor: 'transparent',
      }}
    />
  );
}
