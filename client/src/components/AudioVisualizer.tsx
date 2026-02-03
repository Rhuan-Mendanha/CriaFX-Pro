import { useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AudioVisualizerProps {
  frequencyData: Uint8Array;
  isPlaying: boolean;
  className?: string;
}

export function AudioVisualizer({ frequencyData, isPlaying, className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const smoothedDataRef = useRef<Float32Array | null>(null);
  const { theme } = useTheme();
  const lastFrameTimeRef = useRef<number>(0);

  // Memoize color values to avoid recalculation
  const colors = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      isDark,
      primary: isDark ? 'rgb(34, 197, 94)' : 'rgb(168, 85, 247)',
      secondary: isDark ? 'rgb(22, 163, 74)' : 'rgb(139, 92, 246)',
      accent: isDark ? 'rgb(74, 222, 128)' : 'rgb(196, 181, 253)',
      bgClear: isDark ? 'rgba(15, 15, 15, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      gradientStart: isDark ? 'rgba(34, 197, 94, 0.06)' : 'rgba(168, 85, 247, 0.1)',
      gradientMid: isDark ? 'rgba(34, 197, 94, 0.02)' : 'rgba(168, 85, 247, 0.02)',
      gradientEnd: isDark ? 'rgba(34, 197, 94, 0.06)' : 'rgba(168, 85, 247, 0.1)',
    };
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) return;

    // Initialize smoothed data with Float32Array for better performance
    if (!smoothedDataRef.current) {
      smoothedDataRef.current = new Float32Array(frequencyData.length);
    }

    const smoothed = smoothedDataRef.current;
    const smoothingFactor = 0.75; // Increased for smoother transitions
    const barWidth = canvas.width / frequencyData.length;
    const centerY = canvas.height / 2;

    const draw = (currentTime: number) => {
      // Frame rate limiting for smooth 60fps
      const deltaTime = currentTime - lastFrameTimeRef.current;
      if (deltaTime < 16) { // ~60fps
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

      // Draw frequency bars - optimized
      ctx.fillStyle = colors.primary;
      for (let i = 0; i < smoothed.length; i++) {
        const normalizedValue = smoothed[i] / 255;
        const barHeight = normalizedValue * (canvas.height / 2);
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
      ctx.shadowBlur = 8;
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
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
      // Clear canvas when not playing
      ctx.fillStyle = colors.bgClear;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [frequencyData, isPlaying, colors]);

  return (
    <canvas
      ref={canvasRef}
      width={1400}
      height={500}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}
