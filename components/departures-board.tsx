"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DepartureEntry, DepartureBoard } from '@/types/departure'
import { cn } from '@/lib/utils'

const STATION_A = "Zürich, Sportweg"
const STATION_B = "Zürich, Bernoulli-Häuser"
const LIMIT = 13 // 13 fetch but ui only 5 -> some get filtered (filteredBoard)

export default function DeparturesBoard() {
  const [departures, setDepartures] = useState<(DepartureEntry & { isNew?: boolean })[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<string>(STATION_A)

  useEffect(() => {
    let isCancelled = false
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(selectedStation)}&limit=${LIMIT}`
        )
        const data: DepartureBoard = await response.json()

        if (!data.stationboard) {
          throw new Error("Keine Abfahrten gefunden.")
        }

        // Filter für Bernoulli-Häuser
        let filteredBoard = data.stationboard
        if (selectedStation === STATION_B) {
          filteredBoard = filteredBoard.filter(entry => {
            if (entry.category !== 'T') return false
            if (entry.number === '17') return entry.to !== 'Zürich, Werdhölzli'
            if (entry.number === '8') return entry.to === 'Zürich, Klusplatz'
            return false
          })
        }

        // Neue IDs für Animation markieren
        const currentIds = new Set(departures.map(d => `${d.category}${d.number}${d.stop.departureTimestamp}`))
        const newIds = new Set<string>()
        filteredBoard.forEach(entry => {
          const id = `${entry.category}${entry.number}${entry.stop.departureTimestamp}`
          if (!currentIds.has(id)) newIds.add(id)
        })

        if (isCancelled) return

        // Smooth transition: State erst aktualisieren, dann Animation setzen
        setDepartures(prev =>
          filteredBoard.map(entry => ({
            ...entry,
            isNew: newIds.has(`${entry.category}${entry.number}${entry.stop.departureTimestamp}`)
          }))
        )

        // Clear new entry animations nach 500ms
        setTimeout(() => {
          setDepartures(prev => prev.map(e => ({ ...e, isNew: false })))
        }, 500)

        setError(null)
      } catch (err) {
        console.error("Fehler beim Abrufen der Daten:", err)
        if (!isCancelled) setError("Fehler beim Laden der Daten.")
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [selectedStation])

  const getLineStyle = (category: string, number?: string | number) => {
    const num = String(number ?? '').trim()
    if (category === 'T') {
      if (num === '4') return { backgroundColor: 'rgb(17, 41, 111)' }
      if (num === '17') return { backgroundColor: 'rgb(142, 34, 77)' }
      if (num === '8') return { backgroundColor: 'rgb(138, 181, 31)' }
      return { backgroundColor: '#ef4444' }
    }
    if (category === 'B') {
      return { backgroundColor: '#3b82f6' }
    }
    return { backgroundColor: '#6b7280' }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-destructive text-lg sm:text-xl text-center max-w-md">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="w-full max-w-4xl flex flex-col gap-4 sm:gap-6">
        {/* Header - responsive typography */}
        <div className="text-center space-y-2 sm:space-y-4 pt-4 sm:pt-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-wide leading-tight">
            Nächste Tram-Abfahrten
          </h1>
        </div>

        {/* Station Toggle - responsive layout */}
        <div className="flex items-center justify-center px-2">
          <div className="flex items-center gap-2 sm:gap-3 text-foreground max-w-full">
            <span className={cn(
              "text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none", 
              selectedStation === STATION_A ? "opacity-100" : "opacity-60"
            )}>
              {STATION_A}
            </span>
            <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={selectedStation === STATION_B}
                onChange={() =>
                  setSelectedStation(prev => (prev === STATION_A ? STATION_B : STATION_A))
                }
                aria-label="Station umschalten"
              />
              <div className="w-10 h-5 sm:w-12 sm:h-6 bg-muted rounded-full peer-focus:outline-none peer-checked:bg-primary transition-colors duration-300">
                <div className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 bg-background rounded-full shadow-md transform transition-transform duration-300 mt-0.5 ml-0.5 border-2 border-foreground/20",
                  selectedStation === STATION_B ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                )} />
              </div>
            </label>
            <span className={cn(
              "text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none", 
              selectedStation === STATION_B ? "opacity-100" : "opacity-60"
            )}>
              {STATION_B}
            </span>
          </div>
        </div>

        {/* Departures - responsive cards */}
        <div className="flex-1 w-full space-y-2 sm:space-y-3 flex flex-col justify-start overflow-hidden">
          {departures.slice(0, 5).map((entry, index) => {
            const delay = entry.stop.delay ? ` (+${entry.stop.delay} min)` : ""

            return (
              <Card
                key={`${entry.category}${entry.number}${entry.stop.departureTimestamp}-${index}`}
                className={cn(
                  "bg-card/80 border-l-4 sm:border-l-8 border-l-primary backdrop-blur-sm transition-all duration-500 flex-shrink-0",
                  entry.isNew && "bg-primary/30 animate-pulse"
                )}
              >
                <CardContent className="p-3 sm:p-4 md:p-6 text-sm md:text-base transition-all duration-500">
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                      <span
                        className={cn(
                          "px-2 py-1 sm:px-3 sm:py-2 rounded-md text-white font-bold text-xs sm:text-sm flex-shrink-0"
                        )}
                        style={getLineStyle(entry.category, entry.number)}
                      >
                        {entry.category} {entry.number}
                      </span>
                      <span className="text-foreground text-sm sm:text-base md:text-lg font-medium truncate">
                        {entry.to}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-foreground text-base sm:text-lg md:text-xl font-mono">
                        {formatTime(entry.stop.departureTimestamp)}
                      </div>
                      {delay && (
                        <div className="text-yellow-400 dark:text-yellow-300 text-xs sm:text-sm">
                          {delay}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
