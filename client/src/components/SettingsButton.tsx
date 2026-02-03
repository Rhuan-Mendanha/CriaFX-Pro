import { Settings } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export function SettingsButton() {
  const { setIsSettingsOpen } = useSettings();

  return (
    <button
      onClick={() => setIsSettingsOpen(true)}
      title="Settings"
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors border border-border hover:bg-foreground/10"
    >
      <Settings className="w-5 h-5" />
    </button>
  );
}
