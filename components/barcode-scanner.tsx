"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { useToast } from "@/hooks/use-toast"

type Props = {
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let active = true

    const startScanner = async () => {
      if (!videoRef.current) return

      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, error, callbackControls) => {
            if (!active) {
              callbackControls.stop()
              return
            }

            if (result) {
              active = false
              callbackControls.stop()

              const barcode = result.getText()
              toast({
                title: "✓ Skannaus onnistui",
                description: "Viivakoodi luettu. Tunnistetaan peliä...",
              })

              // The scanner only scans. The add page owns the complete
              // resolve -> details -> addGameToCollection flow.
              onDetectedRef.current(barcode)
              return
            }

            // ZXing emits normal per-frame decode misses as errors while the
            // camera is running. They are not scanner failures and should not
            // be shown to the user. Startup/camera failures are handled below.
            void error
          },
        )

        if (!active) {
          controls.stop()
          return
        }

        controlsRef.current = controls
      } catch (scannerError) {
        console.error("Barcode scanner startup error:", scannerError)
        if (active) {
          setError("Kameran käyttö ei onnistunut. Tarkista selaimen kameraoikeus.")
        }
      }
    }

    void startScanner()

    return () => {
      active = false

      const controls = controlsRef.current
      controlsRef.current = null

      if (controls) {
        try {
          controls.stop()
        } catch {
          // The scanner may already have been stopped after a successful read.
        }
      }
    }
  }, [toast])

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
