"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"

type Props = {
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let active = true

    reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, error) => {
      if (!active) return
      if (result) {
        active = false
        onDetectedRef.current(result.getText())
        reader.reset()
      } else if (error && error.name !== "NotFoundException") {
        setError("Kameran käynnistäminen tai viivakoodin lukeminen epäonnistui.")
      }
    }).catch(() => {
      if (active) setError("Kameran käyttö ei onnistunut. Tarkista selaimen kameraoikeus.")
    })

    return () => {
      active = false
      reader.reset()
    }
  }, [])

  return (
    <div className="rounded-lg border border-accent-gold/30 bg-background/70 p-4 space-y-3">
      <div className="relative overflow-hidden rounded-md bg-black aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-accent-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
      </div>

      {error && <p className="text-sm text-destructive font-body">{error}</p>}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-md border border-accent-gold/30 px-3 py-2 text-sm font-body hover:bg-accent-gold/10"
      >
        Sulje skanneri
      </button>
    </div>
  )
}
