import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={[
        'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
        theme === 'dark'
          ? 'border border-white/20 text-white hover:bg-white/10'
          : 'border border-black/15 text-black hover:bg-black/8',
      ].join(' ')}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
