import { useState } from 'react';
import { X, Palette, Waves, Download, User } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import type { VisualizerStyle } from '@/contexts/SettingsContext';
import type { ExportFormat } from '@/utils/audioExport';

interface SettingsPanelProps {
  onExport?: (format: ExportFormat) => void;
}

type Tab = 'appearance' | 'waves' | 'export' | 'account';

export function SettingsPanel({ onExport }: SettingsPanelProps) {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    visualizerStyle,
    setVisualizerStyle,
    darkModeColors,
    lightModeColors,
    setDarkModeColors,
    setLightModeColors,
  } = useSettings();

  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [isLogin, setIsLogin] = useState(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');

  const [editingDarkColors, setEditingDarkColors] = useState(darkModeColors.colors);
  const [editingLightColors, setEditingLightColors] = useState(lightModeColors.colors);

  if (!isSettingsOpen) return null;

  const handleApplyColors = () => {
    setDarkModeColors({ colors: editingDarkColors });
    setLightModeColors({ colors: editingLightColors });
  };

  const visualizerStyles: Array<{
    value: VisualizerStyle;
    label: string;
    description: string;
  }> = [
    { value: 'flowing-waves', label: 'Flowing Waves', description: 'Smooth sine waves flowing across the screen' },
    { value: 'spiral', label: 'Spiral Galaxy', description: 'Hypnotic spiraling patterns from center' },
    { value: 'frequency-bars', label: 'Frequency Bars', description: 'Classic frequency spectrum bars' },
    { value: 'particle-field', label: 'Particle Field', description: 'Dancing particles reacting to music' },
    { value: 'waveform', label: 'Waveform', description: 'Audio waveform visualization' },
  ];

  const tabs = [
    { id: 'appearance' as Tab, icon: Palette, label: 'Appearance' },
    { id: 'waves' as Tab, icon: Waves, label: 'Wave Style' },
    { id: 'export' as Tab, icon: Download, label: 'Export' },
    { id: 'account' as Tab, icon: User, label: 'Account' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/40">
                <div>
                  <p className="font-medium">Tema</p>
                  <p className="text-sm text-muted-foreground">Alternar claro/escuro</p>
                </div>
                <Button variant="secondary" onClick={toggleTheme}>
                  {theme === 'dark' ? 'Escuro' : 'Claro'}
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Customize Wave Colors</h3>

                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Dark Theme Colors</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {editingDarkColors.map((color, index) => (
                      <input
                        key={index}
                        type="color"
                        value={color.base}
                        onChange={(e) => {
                          const hex = e.target.value;
                          const r = parseInt(hex.slice(1, 3), 16);
                          const g = parseInt(hex.slice(3, 5), 16);
                          const b = parseInt(hex.slice(5, 7), 16);
                          const updated = [...editingDarkColors];
                          updated[index] = { base: hex, rgb: [r, g, b] };
                          setEditingDarkColors(updated);
                        }}
                        className="w-full h-12 rounded cursor-pointer border-2 border-border"
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Light Theme Colors</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {editingLightColors.map((color, index) => (
                      <input
                        key={index}
                        type="color"
                        value={color.base}
                        onChange={(e) => {
                          const hex = e.target.value;
                          const r = parseInt(hex.slice(1, 3), 16);
                          const g = parseInt(hex.slice(3, 5), 16);
                          const b = parseInt(hex.slice(5, 7), 16);
                          const updated = [...editingLightColors];
                          updated[index] = { base: hex, rgb: [r, g, b] };
                          setEditingLightColors(updated);
                        }}
                        className="w-full h-12 rounded cursor-pointer border-2 border-border"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleApplyColors}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
                >
                  Apply Colors
                </Button>
              </div>
            </div>
          )}

          {/* Wave Style */}
          {activeTab === 'waves' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Choose Visualizer Style</h3>
              {visualizerStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setVisualizerStyle(style.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left ${
                    visualizerStyle === style.value
                      ? 'border-foreground bg-foreground/5'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  <h4 className="font-semibold">{style.label}</h4>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Export Audio</h3>
              <Button onClick={() => onExport?.(exportFormat)} disabled={!onExport}>
                Export
              </Button>
            </div>
          )}

          {/* Account */}
          {activeTab === 'account' && (
            <div className="text-center text-muted-foreground">
              Auth UI placeholder
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
