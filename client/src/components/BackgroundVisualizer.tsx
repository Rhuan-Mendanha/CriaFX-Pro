import { useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface BackgroundVisualizerProps {
  frequencyData: Uint8Array;
  isPlaying: boolean;
}

/**
 * Background Visualizer Component
 * - Fixed fullscreen positioning (doesn't affect layout)
 * - Reacts to audio frequency data in real-time
 * - Smooth animations with frame rate limiting
 * - Responsive to theme changes
 */
export function BackgroundVisualizer({ frequencyData, isPlaying }: BackgroundVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const smoothedDataRef = useRef<Float32Array | null>(null);
  const { theme } = useTheme();
  const lastFrameTimeRef = useRef<number>(0);

  // Memoize color values based on theme
  const colors = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      isDark,
      primary: isDark ? 'rgb(34, 197, 94)' : 'rgb(168, 85, 247)',
      secondary: isDark ? 'rgb(22, 163, 74)' : 'rgb(139, 92, 246)',
      accent: isDark ? 'rgb(74, 222, 128)' : 'rgb(196, 181, 253)',
      bgClear: isDark ? 'rgba(15, 15, 15, 0.04)' : 'rgba(255, 255, 255, 0.04)',
      gradientStart: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(168, 85, 247, 0.12)',
      gradientMid: isDark ? 'rgba(34, 197, 94, 0.02)' : 'rgba(168, 85, 247, 0.02)',
      gradientEnd: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(168, 85, 247, 0.12)',
    };
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize smoothed data
    if (!smoothedDataRef.current) {
      smoothedDataRef.current = new Float32Array(frequencyData.length);
    }

    const smoothed = smoothedDataRef.current;
    const smoothingFactor = 0.75;

    const draw = (currentTime: number) => {
      // Frame rate limiting for smooth 60fps
      const deltaTime = currentTime - lastFrameTimeRef.current;
      if (deltaTime < 16) {
        animationIdRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTimeRef.current = currentTime;

      if (!isPlaying) {
        // Fade out when not playing
        ctx.fillStyle = colors.bgClear;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animationIdRef.current = requestAnimationFrame(draw);
        return;
      }

      // Smooth the frequency data
      for (let i = 0; i < frequencyData.length; i++) {
        smoothed[i] = smoothed[i] * smoothingFactor + frequencyData[i] * (1 - smoothingFactor);
      }

      // Clear with fade
      ctx.fillStyle = colors.bgClear;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colors.gradientStart);
      gradient.addColorStop(0.5, colors.gradientMid);
      gradient.addColorStop(1, colors.gradientEnd);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = canvas.width / smoothed.length;
      const centerY = canvas.height / 2;

      ctx.fillStyle = colors.primary;
      for (let i = 0; i < smoothed.length; i++) {
        const normalizedValue = smoothed[i] / 255;
        const barHeight = normalizedValue * (canvas.height / 2.5);
        const x = i * barWidth;

        // Dynamic color based on intensity
        if (colors.isDark) {
          const r = Math.floor(34 + normalizedValue * 40);
          const g = Math.floor(197 + normalizedValue * 58);
          const b = Math.floor(94 + normalizedValue * 34);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          const r = Math.floor(168 + normalizedValue * 28);
          const g = Math.floor(85 + normalizedValue * 96);
          const b = Math.floor(247 - normalizedValue * 47);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        }

        // Draw bars (top and bottom)
        if (barHeight > 0.5) {
          ctx.fillRect(x, centerY - barHeight, barWidth - 0.5, barHeight);
          ctx.fillRect(x, centerY, barWidth - 0.5, barHeight);
        }
      }

      // Draw center line with glow
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationIdRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      animationIdRef.current = requestAnimationFrame(draw);
    } else {
      ctx.fillStyle = colors.bgClear;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [frequencyData, isPlaying, colors]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
