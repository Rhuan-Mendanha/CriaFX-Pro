import { useState } from 'react';
import { X, Palette, Waves, Download } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import type { VisualizerStyle } from '@/contexts/SettingsContext';
import type { ExportFormat } from '@/utils/audioExport';

interface SettingsPanelProps {
  onExport?: (format: ExportFormat) => void;
}

type Tab = 'appearance' | 'waves' | 'export';

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

  const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');

  const [editingDarkColors, setEditingDarkColors] = useState(darkModeColors.colors);
  const [editingLightColors, setEditingLightColors] = useState(lightModeColors.colors);

  if (!isSettingsOpen) return null;

  const handleApplyColors = () => {
    setDarkModeColors({ colors: editingDarkColors });
    setLightModeColors({ colors: editingLightColors });
  };

  const visualizerStyles: Array<{ value: VisualizerStyle; label: string; description: string }> = [
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
  ];

  return (
    // ✅ z-[999] makes settings ALWAYS above header (header is z-[60])
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* ✅ mobile safe space so header never overlaps close button */}
      <div className="bg-card rounded-xl border border-border w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl mt-10 sm:mt-0">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border relative">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>

          {/* ✅ close button with even higher z to be always clickable */}
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 hover:bg-foreground/10 rounded-lg transition-colors relative z-[1000]"
            aria-label="Close settings"
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
          {/* Appearance Tab */}
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

                {/* Dark Mode Colors */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Dark Theme Colors</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {editingDarkColors.map((color, index) => (
                      <div key={index} className="space-y-2">
                        <input
                          type="color"
                          value={color.base}
                          onChange={(e) => {
                            const newColors = [...editingDarkColors];
                            const hex = e.target.value;
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            newColors[index] = { base: hex, rgb: [r, g, b] };
                            setEditingDarkColors(newColors);
                          }}
                          className="w-full h-12 rounded cursor-pointer border-2 border-border"
                        />
                        <p className="text-xs text-center text-muted-foreground">Color {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Light Mode Colors */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Light Theme Colors</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {editingLightColors.map((color, index) => (
                      <div key={index} className="space-y-2">
                        <input
                          type="color"
                          value={color.base}
                          onChange={(e) => {
                            const newColors = [...editingLightColors];
                            const hex = e.target.value;
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            newColors[index] = { base: hex, rgb: [r, g, b] };
                            setEditingLightColors(newColors);
                          }}
                          className="w-full h-12 rounded cursor-pointer border-2 border-border"
                        />
                        <p className="text-xs text-center text-muted-foreground">Color {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleApplyColors}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                >
                  Apply Colors
                </Button>
              </div>
            </div>
          )}

          {/* Wave Style Tab */}
          {activeTab === 'waves' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Choose Visualizer Style</h3>
              {visualizerStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setVisualizerStyle(style.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    visualizerStyle === style.value
                      ? 'border-foreground bg-foreground/5'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{style.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
                    </div>
                    {visualizerStyle === style.value && (
                      <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                        <div className="w-2 h-2 bg-background rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Export Modified Audio</h3>
              <p className="text-muted-foreground mb-4">
                Export your current track with all equalizer settings applied.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'wav' as ExportFormat, label: 'WAV', description: 'Lossless' },
                    { value: 'mp3' as ExportFormat, label: 'MP3', description: 'Compressed' },
                    { value: 'ogg' as ExportFormat, label: 'OGG', description: 'Open Source' },
                  ].map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setExportFormat(format.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        exportFormat === format.value
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border hover:border-foreground/50'
                      }`}
                    >
                      <div className="font-semibold text-foreground">{format.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-4 mb-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Equalizer settings will be applied</li>
                  <li>✓ High-quality audio (44.1kHz)</li>
                  <li>✓ Format: {exportFormat.toUpperCase()}</li>
                </ul>
              </div>

              <Button
                onClick={() => onExport?.(exportFormat)}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                disabled={!onExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export as {exportFormat.toUpperCase()}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
