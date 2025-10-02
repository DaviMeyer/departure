"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type ThemeMode = 'system' | 'dark' | 'light'

interface ThemeColors {
  primary: string
  accent: string
  radius: string
}

interface ThemeContextType {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  colors: ThemeColors
  setColors: (colors: Partial<ThemeColors>) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultColors: ThemeColors = {
  primary: '210 100% 60%',
  accent: '220 30% 15%',
  radius: '0.5rem'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [colors, setColorsState] = useState<ThemeColors>(defaultColors)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode
    const savedColors = localStorage.getItem('theme-colors')
    
    if (savedMode && ['system', 'dark', 'light'].includes(savedMode)) {
      setModeState(savedMode)
    }
    
    if (savedColors) {
      try {
        setColorsState({ ...defaultColors, ...JSON.parse(savedColors) })
      } catch (e) {
        console.error('Failed to parse saved colors:', e)
      }
    }
  }, [])

  // Handle system theme detection and updates
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedTheme(isDark ? 'dark' : 'light')
      } else {
        setResolvedTheme(mode === 'dark' ? 'dark' : 'light')
      }
    }

    updateResolvedTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (mode === 'system') {
        updateResolvedTheme()
      }
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mode])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light')
    
    // Add current theme class
    root.classList.add(resolvedTheme)
    
    // Apply custom colors
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--accent', colors.accent)
    root.style.setProperty('--radius', colors.radius)
  }, [resolvedTheme, colors])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)
  }

  const setColors = (newColors: Partial<ThemeColors>) => {
    const updated = { ...colors, ...newColors }
    setColorsState(updated)
    localStorage.setItem('theme-colors', JSON.stringify(updated))
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, setColors, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
