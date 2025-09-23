"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DepartureEntry, DepartureBoard } from '@/types/departure'
import { cn } from '@/lib/utils'

const STATION_A = "Zürich, Sportweg"
const STATION_B = "Zürich, Bernoulli-Häuser"
const LIMIT = 13 // 13 fetch but ui only 5 -> some get filtered (filteredBoard)

export default function DeparturesBoard() {
  const [departures, setDepartures] = useState<DepartureEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEntries, setNewEntries] = useState<Set<string>>(new Set())
  const [selectedStation, setSelectedStation] = useState<string>(STATION_A)

  useEffect(() => {
    let isCancelled = false
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(selectedStation)}&limit=${LIMIT}`
        )
        const data: DepartureBoard = await response.json()

        if (!data.stationboard) {
          throw new Error("Keine Abfahrten gefunden.")
        }

        // Mark new entries for animation
        const currentIds = new Set(departures.map(d => `${d.category}${d.number}${d.stop.departureTimestamp}`))
        const newIds = new Set<string>()

        data.stationboard.forEach(entry => {
          const id = `${entry.category}${entry.number}${entry.stop.departureTimestamp}`
          if (!currentIds.has(id)) {
            newIds.add(id)
          }
        })

        if (isCancelled) return

        // Filter for Bernoulli-Häuser
        let filteredBoard = data.stationboard
        if (selectedStation === STATION_B) {
          filteredBoard = filteredBoard.filter(entry => {
            if (entry.category !== 'T') return false // nur Trams
            if (entry.number === '17') return entry.to === 'Zürich, Bahnhofplatz/HB'
            if (entry.number === '8') return entry.to === 'Zürich, Klusplatz'
            return false // alle anderen Linien ausblenden
          })
        }

        setDepartures(filteredBoard)
        setNewEntries(newIds)
        setError(null)

        // Clear new entry animations after 500ms
        setTimeout(() => setNewEntries(new Set()), 500)
      } catch (err) {
        console.error("Fehler beim Abrufen der Daten:", err)
        if (!isCancelled) setError("Fehler beim Laden der Daten.")
      } finally {
        if (!isCancelled) setLoading(false)
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-white text-xl">Lade Abfahrten...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-4xl h-full flex flex-col">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 tracking-wide flex-shrink-0">
          Nächste Tram-Abfahrten
        </h1>

        {/* Slider Switch für Stationswahl */}
        <div className="mb-4 flex items-center justify-center flex-shrink-0">
         <div className="flex items-center gap-3 text-white">
           <span className={cn("text-sm", selectedStation === STATION_A ? "opacity-100" : "opacity-60")}>
             {STATION_A}
           </span>
           <label className="relative inline-flex items-center cursor-pointer select-none">
             <input
               type="checkbox"
               className="sr-only peer"
               checked={selectedStation === STATION_B}
               onChange={() =>
                 setSelectedStation(prev => (prev === STATION_A ? STATION_B : STATION_A))
               }
               aria-label="Station umschalten"
             />
             <div className="w-12 h-6 bg-gray-500/40 rounded-full peer-focus:outline-none peer-checked:bg-blue-500 transition-colors duration-300">
               <div className={cn(
                 "w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-0.5 ml-0.5",
                 selectedStation === STATION_B ? "translate-x-6" : "translate-x-0"
               )} />
             </div>
           </label>
           <span className={cn("text-sm", selectedStation === STATION_B ? "opacity-100" : "opacity-60")}>
             {STATION_B}
           </span>
         </div>

        </div>

        {/* Abfahrten */}
        <div className="flex-1 w-full space-y-2 overflow-hidden flex flex-col justify-start">
          {departures.slice(0, 5).map((entry, index) => {
            const entryId = `${entry.category}${entry.number}${entry.stop.departureTimestamp}`
            const isNew = newEntries.has(entryId)
            const delay = entry.stop.delay ? ` (+${entry.stop.delay} min)` : ""

            return (
              <Card
                key={`${entryId}-${index}`}
                className={cn(
                  "bg-white/10 border-l-8 border-l-blue-400 backdrop-blur-sm transition-all duration-300 flex-shrink",
                  isNew && "bg-blue-400/30 animate-pulse"
                )}
              >
                <CardContent className="p-4 md:p-6 text-sm md:text-base">
                  <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "px-3 py-2 rounded-md text-white font-bold text-sm"
                        )}
                        style={getLineStyle(entry.category, entry.number)}
                      >
                        {entry.category} {entry.number}
                      </span>
                      <span className="text-white text-lg font-medium">
                        {entry.to}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-white text-xl font-mono">
                        {formatTime(entry.stop.departureTimestamp)}
                      </div>
                      {delay && (
                        <div className="text-yellow-400 text-sm">
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
