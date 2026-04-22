"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DepartureEntry, DepartureBoard } from '@/types/departure'
import { cn } from '@/lib/utils'
import { ChevronDown, History } from 'lucide-react'
import LoadingScreen from './loading-screen'

const STATION_A = "Zürich, Sportweg"
const STATION_B = "Zürich, Bernoulli-Häuser"
const LIMIT = 13 // 13 fetch but ui only 5 -> some get filtered (filteredBoard)
const PAST_LOOKBACK_MIN = 15

const entryId = (e: DepartureEntry) =>
  `${e.category}${e.number}${e.stop.departureTimestamp}`

const stationboardUrl = (station: string, limit: number, minutesAgo?: number) => {
  const base = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(station)}&limit=${limit}`
  if (minutesAgo == null) return base
  const t = new Date(Date.now() - minutesAgo * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const datetime = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
  return `${base}&datetime=${encodeURIComponent(datetime)}`
}

const applyStationFilter = (board: DepartureEntry[], station: string) => {
  if (station !== STATION_B) return board
  return board.filter(entry => {
    if (entry.category !== 'T') return false
    if (entry.number === '17') return entry.to !== 'Zürich, Werdhölzli'
    if (entry.number === '8') return entry.to === 'Zürich, Kirche Fluntern'
    return false
  })
}

export default function DeparturesBoard() {
  const [departures, setDepartures] = useState<(DepartureEntry & { isNew?: boolean })[]>([])
  const [pastDepartures, setPastDepartures] = useState<DepartureEntry[]>([])
  const [showPast, setShowPast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedStation, setSelectedStation] = useState<string>(STATION_A)
  const prevDeparturesRef = useRef<DepartureEntry[]>([])

  useEffect(() => {
    prevDeparturesRef.current = []
    setPastDepartures([])
    setShowPast(false)
  }, [selectedStation])

  useEffect(() => {
    let isCancelled = false

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [upcomingRes, pastRes] = await Promise.all([
          fetch(stationboardUrl(selectedStation, LIMIT)),
          fetch(stationboardUrl(selectedStation, 10, PAST_LOOKBACK_MIN)),
        ])
        const [upcomingData, pastData]: [DepartureBoard, DepartureBoard] = await Promise.all([
          upcomingRes.json(),
          pastRes.json(),
        ])

        if (!upcomingData.stationboard) throw new Error("Keine Abfahrten gefunden.")
        if (isCancelled) return

        // Upcoming
        const filteredBoard = applyStationFilter(upcomingData.stationboard, selectedStation)

        const prevIdSet = new Set(prevDeparturesRef.current.map(entryId))
        const newEntryIds = new Set(filteredBoard.filter(e => !prevIdSet.has(entryId(e))).map(entryId))
        prevDeparturesRef.current = filteredBoard

        setDepartures(filteredBoard.map(entry => ({ ...entry, isNew: newEntryIds.has(entryId(entry)) })))
        setTimeout(() => setDepartures(prev => prev.map(e => ({ ...e, isNew: false }))), 500)

        // Past: filter to entries whose actual departure is already in the past
        if (pastData.stationboard) {
          const nowTs = Math.floor(Date.now() / 1000)
          const pastBoard = applyStationFilter(pastData.stationboard, selectedStation)
            .filter(e => e.stop.departureTimestamp + (e.stop.delay ?? 0) * 60 < nowTs)
            .sort((a, b) => a.stop.departureTimestamp - b.stop.departureTimestamp)
            .slice(0, 5)
          setPastDepartures(pastBoard)
        }

        setError(null)
        setIsLoading(false)
      } catch (err) {
        console.error("Fehler beim Abrufen der Daten:", err)
        if (!isCancelled) {
          setError("Fehler beim Laden der Daten.")
          setIsLoading(false)
        }
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => {
      isCancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation])

  const getLineStyle = (category: string, number?: string | number) => {
    const num = String(number ?? '').trim()
    if (category === 'T') {
      if (num === '51') return { backgroundColor: 'rgb(0, 0, 0)' }
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

  // Show loading screen only during initial load or when no data is available yet
  if (isLoading && departures.length === 0) {
    return <LoadingScreen />
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
    <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-4 md:p-6">
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

        {/* Past Departures - collapsible section */}
        <div className="w-full">
          <button
            onClick={() => setShowPast(p => !p)}
            className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/20 transition-all duration-200 text-xs sm:text-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Letzte Abfahrten</span>
              {pastDepartures.length > 0 && (
                <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {pastDepartures.length}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform duration-300",
                showPast && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              showPast ? "max-h-[600px] opacity-100 mt-2" : "max-h-0 opacity-0"
            )}
          >
            {pastDepartures.length === 0 ? (
              <p className="text-center text-muted-foreground/60 text-xs sm:text-sm py-4">
                Noch keine Abfahrten erfasst — wird nach dem nächsten Abruf aktualisiert.
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {pastDepartures.map((entry, index) => {
                  const delay = entry.stop.delay ? ` (+${entry.stop.delay} min)` : ""
                  return (
                    <Card
                      key={`past-${entryId(entry)}-${index}`}
                      className="bg-card/40 border-l-4 sm:border-l-8 border-l-border backdrop-blur-sm flex-shrink-0 opacity-50"
                    >
                      <CardContent className="p-3 sm:p-4 md:p-6 text-sm md:text-base">
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                            <span
                              className="px-2 py-1 sm:px-3 sm:py-2 rounded-md text-white/70 font-bold text-xs sm:text-sm flex-shrink-0 grayscale"
                              style={getLineStyle(entry.category, entry.number)}
                            >
                              {entry.category} {entry.number}
                            </span>
                            <span className="text-muted-foreground text-sm sm:text-base md:text-lg font-medium truncate">
                              {entry.to}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-muted-foreground text-base sm:text-lg md:text-xl font-mono">
                              {formatTime(entry.stop.departureTimestamp)}
                            </div>
                            {delay && (
                              <div className="text-muted-foreground/70 text-xs sm:text-sm">
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
            )}
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
