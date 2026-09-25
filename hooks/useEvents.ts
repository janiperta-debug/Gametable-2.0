"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getPublicEvents, getMyEvents, getPastEvents, type Event } from "@/app/actions/events"

interface UseEventsReturn {
  publicEvents: Event[]
  myEvents: Event[]
  pastEvents: Event[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useEvents(): UseEventsReturn {
  const [publicEvents, setPublicEvents] = useState<Event[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const fetchEvents = useCallback(async () => {
    // Visibility/focus can fire together on iOS. Avoid overlapping requests and
    // guarantee that a stalled Server Action never leaves the spinner running.
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    setError(null)

    const withTimeout = async <T,>(request: Promise<T>): Promise<T> => {
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        return await Promise.race([
          request,
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error("EVENTS_TIMEOUT")), 12000)
          }),
        ])
      } finally {
        if (timeout !== undefined) clearTimeout(timeout)
      }
    }

    try {
      // A slow personal/history request must not block the public event list.
      const [publicResult, myResult, pastResult] = await Promise.allSettled([
        withTimeout(getPublicEvents()),
        withTimeout(getMyEvents()),
        withTimeout(getPastEvents()),
      ])

      if (publicResult.status === "fulfilled" && !publicResult.value.error) {
        setPublicEvents(publicResult.value.events)
      } else {
        const message = publicResult.status === "rejected"
          ? (publicResult.reason instanceof Error && publicResult.reason.message === "EVENTS_TIMEOUT"
              ? "Tapahtumien lataus aikakatkaistiin. Yritä uudelleen."
              : "Tapahtumien lataus epäonnistui. Yritä uudelleen.")
          : publicResult.value.error || "Tapahtumien lataus epäonnistui."
        setError(message)
        console.error("Public events load failed:", publicResult.status === "rejected" ? publicResult.reason : publicResult.value.error)
      }
      if (myResult.status === "fulfilled" && !myResult.value.error) setMyEvents(myResult.value.events)
      if (pastResult.status === "fulfilled" && !pastResult.value.error) setPastEvents(pastResult.value.events)
      if (myResult.status === "rejected") console.error("My events load failed:", myResult.reason)
      if (pastResult.status === "rejected") console.error("Past events load failed:", pastResult.reason)
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Refresh when returning to the Events view. This keeps newly created,
  // completed, or updated events visible without requiring an app restart.
  useEffect(() => {
    const handleReturn = () => {
      if (document.visibilityState === "visible") {
        fetchEvents()
      }
    }

    window.addEventListener("focus", handleReturn)
    window.addEventListener("pageshow", handleReturn)
    document.addEventListener("visibilitychange", handleReturn)

    return () => {
      window.removeEventListener("focus", handleReturn)
      window.removeEventListener("pageshow", handleReturn)
      document.removeEventListener("visibilitychange", handleReturn)
    }
  }, [fetchEvents])

  return {
    publicEvents,
    myEvents,
    pastEvents,
    loading,
    error,
    refetch: fetchEvents,
  }
}
