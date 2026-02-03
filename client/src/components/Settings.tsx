import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Palette, Waves, Download, User, LogIn } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onColorChange?: (darkColors: string[], lightColors: string[]) => void;
  onWaveStyleChange?: (style: string) => void;
  onExportAudio?: () => void;
}

type TabType = 'appearance' | 'waves' | 'export' | 'account';

export function Settings({ isOpen, onClose, onColorChange, onWaveStyleChange, onExportAudio }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [isLogin, setIsLogin] = useState(true);

  // Color pickers for dark mode
  const [darkColors, setDarkColors] = useState([
    '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB',
    '#DDA0DD', '#DA70D6', '#EE82EE', '#FF00FF'
  ]);

  // Color pickers for light mode
  const [lightColors, setLightColors] = useState([
    '#00CED1', '#00E5E5', '#00BFFF', '#1E90FF',
    '#00FA9A', '#00FF7F', '#32CD32', '#00FF00'
  ]);

  const [selectedWaveStyle, setSelectedWaveStyle] = useState('flowing');

  const waveStyles = [
    { id: 'flowing', name: 'Flowing Waves', description: 'Smooth horizontal waves' },
    { id: 'circular', name: 'Circular Ripples', description: 'Expanding circles from center' },
    { id: 'bars', name: 'Frequency Bars', description: 'Classic vertical bars' },
    { id: 'particles', name: 'Particle Field', description: 'Floating particles' },
    { id: 'waveform', name: 'Waveform', description: 'Traditional audio waveform' },
  ];

  const handleColorChange = (index: number, color: string, isDark: boolean) => {
    if (isDark) {
      const newColors = [...darkColors];
      newColors[index] = color;
      setDarkColors(newColors);
    } else {
      const newColors = [...lightColors];
      newColors[index] = color;
      setLightColors(newColors);
    }
  };

  const handleApplyColors = () => {
    onColorChange?.(darkColors, lightColors);
  };

  const handleWaveStyleChange = (styleId: string) => {
    setSelectedWaveStyle(styleId);
    onWaveStyleChange?.(styleId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'appearance'
                ? 'border-purple-600 text-purple-600 dark:border-pink-500 dark:text-pink-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="w-4 h-4 inline mr-2" />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('waves')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'waves'
                ? 'border-purple-600 text-purple-600 dark:border-pink-500 dark:text-pink-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Waves className="w-4 h-4 inline mr-2" />
            Wave Style
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'export'
                ? 'border-purple-600 text-purple-600 dark:border-pink-500 dark:text-pink-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'account'
                ? 'border-purple-600 text-purple-600 dark:border-pink-500 dark:text-pink-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Account
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Dark Mode Wave Colors</h3>
                <div className="grid grid-cols-4 gap-4">
                  {darkColors.map((color, index) => (
                    <div key={`dark-${index}`} className="space-y-2">
                      <label className="text-sm text-muted-foreground">Color {index + 1}</label>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value, true)}
                        className="w-full h-12 rounded cursor-pointer border-2 border-border"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold mb-4">Light Mode Wave Colors</h3>
                <div className="grid grid-cols-4 gap-4">
                  {lightColors.map((color, index) => (
                    <div key={`light-${index}`} className="space-y-2">
                      <label className="text-sm text-muted-foreground">Color {index + 1}</label>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value, false)}
                        className="w-full h-12 rounded cursor-pointer border-2 border-border"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleApplyColors} className="w-full bg-purple-600 hover:bg-purple-700">
                Apply Colors
              </Button>
            </div>
          )}

          {/* Wave Style Tab */}
          {activeTab === 'waves' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Choose Visualizer Style</h3>
              {waveStyles.map((style) => (
                <div
                  key={style.id}
                  onClick={() => handleWaveStyleChange(style.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedWaveStyle === style.id
                      ? 'border-purple-600 dark:border-pink-500 bg-purple-600/10 dark:bg-pink-500/10'
                      : 'border-border hover:border-purple-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{style.name}</h4>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </div>
                    {selectedWaveStyle === style.id && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 dark:bg-pink-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Download className="w-16 h-16 mx-auto text-purple-600 dark:text-pink-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Export Modified Audio</h3>
                <p className="text-muted-foreground mb-6">
                  Export your current track with all equalizer settings applied
                </p>
                <Button
                  onClick={onExportAudio}
                  className="bg-purple-600 hover:bg-purple-700 px-8 py-6 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export Audio
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-semibold mb-2">Export Info:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Format: WAV (uncompressed)</li>
                  <li>Includes all equalizer modifications</li>
                  <li>Preserves audio quality</li>
                  <li>Processing time: ~10 seconds</li>
                </ul>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`px-6 py-2 rounded-md transition-colors ${
                      isLogin
                        ? 'bg-purple-600 dark:bg-pink-500 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`px-6 py-2 rounded-md transition-colors ${
                      !isLogin
                        ? 'bg-purple-600 dark:bg-pink-500 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <div className="max-w-md mx-auto">
                {isLogin ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <User className="w-4 h-4 mr-2" />
                      Create Account
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
