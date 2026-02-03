import React, { createContext, useContext, useState, useEffect } from 'react';

export type VisualizerStyle = 'flowing-waves' | 'spiral' | 'frequency-bars' | 'particle-field' | 'waveform';

export interface ColorPalette {
  colors: Array<{ base: string; rgb: [number, number, number] }>;
}

export interface SettingsContextType {
  // Visualizer settings
  visualizerStyle: VisualizerStyle;
  setVisualizerStyle: (style: VisualizerStyle) => void;
  
  // Color settings
  darkModeColors: ColorPalette;
  lightModeColors: ColorPalette;
  setDarkModeColors: (colors: ColorPalette) => void;
  setLightModeColors: (colors: ColorPalette) => void;
  
  // Settings panel
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_DARK_COLORS: ColorPalette = {
  colors: [
    { base: '#FF1493', rgb: [255, 20, 147] },   // Deep Pink
    { base: '#FF69B4', rgb: [255, 105, 180] },  // Hot Pink
    { base: '#FFB6C1', rgb: [255, 182, 193] },  // Light Pink
    { base: '#FFC0CB', rgb: [255, 192, 203] },  // Pink
    { base: '#DDA0DD', rgb: [221, 160, 221] },  // Plum
    { base: '#DA70D6', rgb: [218, 112, 214] },  // Orchid
    { base: '#EE82EE', rgb: [238, 130, 238] },  // Violet
    { base: '#FF00FF', rgb: [255, 0, 255] },    // Magenta
  ]
};

const DEFAULT_LIGHT_COLORS: ColorPalette = {
  colors: [
    { base: '#00CED1', rgb: [0, 206, 209] },    // Dark Turquoise
    { base: '#00E5E5', rgb: [0, 229, 229] },    // Cyan
    { base: '#00BFFF', rgb: [0, 191, 255] },    // Deep Sky Blue
    { base: '#1E90FF', rgb: [30, 144, 255] },   // Dodger Blue
    { base: '#00FA9A', rgb: [0, 250, 154] },    // Medium Spring Green
    { base: '#00FF7F', rgb: [0, 255, 127] },    // Spring Green
    { base: '#32CD32', rgb: [50, 205, 50] },    // Lime Green
    { base: '#00FF00', rgb: [0, 255, 0] },      // Green
  ]
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>(() => {
    const saved = localStorage.getItem('criafx-visualizer-style');
    return (saved as VisualizerStyle) || 'flowing-waves';
  });
  
  const [darkModeColors, setDarkModeColors] = useState<ColorPalette>(() => {
    const saved = localStorage.getItem('criafx-dark-colors');
    return saved ? JSON.parse(saved) : DEFAULT_DARK_COLORS;
  });
  
  const [lightModeColors, setLightModeColors] = useState<ColorPalette>(() => {
    const saved = localStorage.getItem('criafx-light-colors');
    return saved ? JSON.parse(saved) : DEFAULT_LIGHT_COLORS;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Persist settings
  useEffect(() => {
    localStorage.setItem('criafx-visualizer-style', visualizerStyle);
  }, [visualizerStyle]);
  
  useEffect(() => {
    localStorage.setItem('criafx-dark-colors', JSON.stringify(darkModeColors));
  }, [darkModeColors]);
  
  useEffect(() => {
    localStorage.setItem('criafx-light-colors', JSON.stringify(lightModeColors));
  }, [lightModeColors]);

  return (
    <SettingsContext.Provider
      value={{
        visualizerStyle,
        setVisualizerStyle,
        darkModeColors,
        lightModeColors,
        setDarkModeColors,
        setLightModeColors,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
