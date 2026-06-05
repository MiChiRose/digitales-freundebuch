import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const themes = [
  {
    id: 'lavender',
    name: 'Lavender Dream',
    primary: '#A78BFA',
    secondary: '#F8F6FF',
    text: '#4A4063',
    card: '#FFFFFF',
    accent: '#C3B1E1',
    buttonText: '#FFFFFF',
    icon: '🌸'
  },
  {
    id: 'mint',
    name: 'Mint Fresh',
    primary: '#4ADE80',
    secondary: '#F0FFF4',
    text: '#064E3B',
    card: '#FFFFFF',
    accent: '#B8F2E6',
    buttonText: '#FFFFFF',
    icon: '🌿'
  },
  {
    id: 'candy',
    name: 'Candy Pop',
    primary: '#F472B6',
    secondary: '#FFF1F2',
    text: '#831843',
    card: '#FFFFFF',
    accent: '#FF9ED1',
    buttonText: '#FFFFFF',
    icon: '🍭'
  },
  {
    id: 'sky',
    name: 'Sky High',
    primary: '#60A5FA',
    secondary: '#EFF6FF',
    text: '#1E3A8A',
    card: '#FFFFFF',
    accent: '#93C5FD',
    buttonText: '#FFFFFF',
    icon: '☁️'
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    primary: '#FB923C',
    secondary: '#FFF7ED',
    text: '#7C2D12',
    card: '#FFFFFF',
    accent: '#FFD34E',
    buttonText: '#FFFFFF',
    icon: '☀️'
  }
];

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem('app_theme');
      if (savedThemeId) {
        const theme = themes?.find(t => t?.id === savedThemeId);
        if (theme) setCurrentTheme(theme);
      }
    } catch (e) {
      console.error('Failed to load theme', e);
    }
  };

  const changeTheme = async (themeId) => {
    const theme = themes?.find(t => t?.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      try {
        await AsyncStorage.setItem('app_theme', themeId);
      } catch (e) {
        console.error('Failed to save theme', e);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
