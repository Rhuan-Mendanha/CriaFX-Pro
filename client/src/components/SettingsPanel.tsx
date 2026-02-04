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
  const { isSettingsOpen, setIsSettingsOpen, visualizerStyle, setVisualizerStyle, darkModeColors, lightModeColors, setDarkModeColors, setLightModeColors } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [isLogin, setIsLogin] = useState(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');
  
  // Local state for color editing
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
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/40">
  <div>
    <p className="font-medium">Tema</p>
    <p className="text-sm text-muted-foreground">Alternar claro/escuro</p>
  </div>
  <Button
    variant="secondary"
    onClick={() => toggleTheme?.()}
    disabled={!toggleTheme}
  >
    {theme === 'dark' ? 'Escuro' : 'Claro'}
  </Button>
</div>

            <div className="space-y-6">
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
              <h3 className="text-lg font-semibold mb-4">Export Modified Audio</h3>
              <p className="text-muted-foreground mb-4">
                Export your current track with all equalizer settings applied.
              </p>
              
              {/* Format Selection */}
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

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Toggle Pills */}
              <div className="flex gap-2 p-1 bg-muted/30 rounded-lg">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                    isLogin
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                    !isLogin
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-center mb-6">
                  {isLogin ? 'Welcome Back!' : 'Create Your Account'}
                </h3>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground"
                      placeholder="John Doe"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground"
                    placeholder="••••••••"
                  />
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <button className="text-foreground hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button 
                  className="w-full py-6 text-base font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                >
                  {isLogin ? 'Login to CriaFX' : 'Create Account'}
                </Button>

                {!isLogin && (
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">or continue with</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-4 py-3 border-2 border-border rounded-lg hover:border-foreground transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium">Google</span>
                  </button>
                  <button className="px-4 py-3 border-2 border-border rounded-lg hover:border-foreground transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="font-medium">GitHub</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
