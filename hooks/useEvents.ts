"use client"

import { useState, useEffect, useCallback } from "react"
import { getPublicEvents, getMyEvents, type Event } from "@/app/actions/events"

interface UseEventsReturn {
  publicEvents: Event[]
  myEvents: Event[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useEvents(): UseEventsReturn {
  const [publicEvents, setPublicEvents] = useState<Event[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [publicResult, myResult] = await Promise.all([
        getPublicEvents(),
        getMyEvents(),
      ])

      if (publicResult.error) {
        setError(publicResult.error)
      } else {
        setPublicEvents(publicResult.events)
      }

      // My events may fail if not logged in - that's ok
      if (!myResult.error) {
        setMyEvents(myResult.events)
      }
    } catch (err) {
      console.error("Error fetching events:", err)
      setError("Failed to load events")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    publicEvents,
    myEvents,
    loading,
    error,
    refetch: fetchEvents,
  }
}
