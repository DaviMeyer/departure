"use client"

import { useState } from 'react'
import { useTheme } from './theme-provider'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Sun, Moon, Monitor, Palette, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ThemeSettings() {
  const { mode, setMode, colors, setColors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const modes = [
    { value: 'system' as const, label: 'System', icon: Monitor },
    { value: 'light' as const, label: 'Bright', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
  ]

  const presetColors = [
    { name: 'Blue', primary: '210 100% 60%', accent: '220 30% 15%' },
    { name: 'Green', primary: '142 76% 36%', accent: '142 30% 15%' },
    { name: 'Purple', primary: '262 83% 58%', accent: '262 30% 15%' },
    { name: 'Orange', primary: '24 95% 53%', accent: '24 30% 15%' },
    { name: 'Pink', primary: '330 81% 60%', accent: '330 30% 15%' },
    { name: 'Teal', primary: '173 80% 40%', accent: '173 30% 15%' },
  ]

  const radiusOptions = [
    { label: 'None', value: '0rem' },
    { label: 'Small', value: '0.3rem' },
    { label: 'Medium', value: '0.5rem' },
    { label: 'Large', value: '0.75rem' },
    { label: 'Full', value: '1rem' },
  ]

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-2 right-2 sm:top-4 sm:right-4 z-40 p-2 sm:p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-all duration-200 hover:scale-105"
        aria-label="Theme settings"
      >
        <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border-border shadow-xl sm:mr-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl sm:text-2xl font-bold">Theme Settings</CardTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Theme Mode Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Appearance</h3>
                <div className="grid grid-cols-3 gap-2">
                  {modes.map((modeOption) => {
                    const Icon = modeOption.icon
                    return (
                      <button
                        key={modeOption.value}
                        onClick={() => setMode(modeOption.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200",
                          mode === modeOption.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-accent"
                        )}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-xs sm:text-sm font-medium">{modeOption.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Accent Color Presets */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Accent Color</h3>
                <div className="grid grid-cols-3 gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setColors({ primary: preset.primary, accent: preset.accent })}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
                        colors.primary === preset.primary
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-full shadow-sm"
                        style={{ backgroundColor: `hsl(${preset.primary})` }}
                      />
                      <span className="text-xs font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Border Radius</h3>
                <div className="grid grid-cols-5 gap-2">
                  {radiusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setColors({ radius: option.value })}
                      className={cn(
                        "flex flex-col items-center gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all duration-200",
                        colors.radius === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div
                        className="w-6 h-6 bg-primary"
                        style={{ borderRadius: option.value }}
                      />
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Preview</h3>
                <div className="p-4 rounded-lg bg-accent border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1 rounded-md text-white font-bold text-sm"
                      style={{ backgroundColor: `hsl(${colors.primary})` }}
                    >
                      T 17
                    </div>
                    <span className="text-sm font-medium">Sample Departure</span>
                  </div>
                  <div
                    className="p-3 bg-card border border-border"
                    style={{ borderRadius: colors.radius }}
                  >
                    <p className="text-sm">This is how cards will look with your theme</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
