"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DepartureEntry, DepartureBoard } from '@/types/departure'
import { cn } from '@/lib/utils'

const STATION = "Zürich, Sportweg"
const LIMIT = 5

export default function DeparturesBoard() {
  const [departures, setDepartures] = useState<DepartureEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEntries, setNewEntries] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(STATION)}&limit=${LIMIT}`
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

        setDepartures(data.stationboard)
        setNewEntries(newIds)
        setError(null)
        
        // Clear new entry animations after 500ms
        setTimeout(() => setNewEntries(new Set()), 500)
      } catch (err) {
        console.error("Fehler beim Abrufen der Daten:", err)
        setError("Fehler beim Laden der Daten.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getLineBackgroundColor = (category: string) => {
    switch (category) {
      case 'T': return 'bg-red-500'
      case 'B': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Lade Abfahrten...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8 tracking-wide">
          Nächste Tram-Abfahrten
        </h1>
        
        <div className="space-y-4">
          {departures.map((entry) => {
            const entryId = `${entry.category}${entry.number}${entry.stop.departureTimestamp}`
            const isNew = newEntries.has(entryId)
            const delay = entry.stop.delay ? ` (+${entry.stop.delay} min)` : ""

            return (
              <Card 
                key={entryId}
                className={cn(
                  "bg-white/10 border-l-8 border-l-blue-400 backdrop-blur-sm transition-all duration-300",
                  isNew && "bg-blue-400/30 animate-pulse"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <span 
                        className={cn(
                          "px-3 py-2 rounded-md text-white font-bold text-sm",
                          getLineBackgroundColor(entry.category)
                        )}
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