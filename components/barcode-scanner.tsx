"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { useToast } from "@/hooks/use-toast"

type Props = {
  onDetected: (barcode: string) => void
  onClose: () => void
}

function inferCategoryFromPage(): "board_game" | "rpg" {
  const pressedButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-pressed="true"]'))
  const categoryButton = pressedButtons.find((button) => {
    const label = button.textContent?.trim() || ""
    return /Lautapelit|Board Games?|Roolipelit|Role[- ]?playing|RPG/i.test(label)
  })

  const label = categoryButton?.textContent?.trim() || ""
  return /Roolipelit|Role[- ]?playing|RPG/i.test(label) ? "rpg" : "board_game"
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
                description: "Viivakoodi luettu. Peliä lisätään kokoelmaan...",
              })

              void (async () => {
                try {
                  const category = inferCategoryFromPage()
                  const response = await fetch("/api/barcode/auto-add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ barcode, category }),
                  })
                  const data = await response.json()

                  if (response.ok && data.success) {
                    toast({
                      title: "✓ Peli lisätty kokoelmaan",
                      description: data.game?.name || "Peli lisättiin kokoelmaan.",
                    })
                    onClose()
                    return
                  }

                  // Preserve the existing resolver/search flow as a fallback
                  // when automatic collection add cannot complete.
                  onDetectedRef.current(barcode)
                } catch (autoAddError) {
                  console.error("Barcode auto-add error:", autoAddError)
                  onDetectedRef.current(barcode)
                }
              })()
            } else if (error && error.name !== "NotFoundException") {
              setError("Kameran käynnistäminen tai viivakoodin lukeminen epäonnistui.")
            }
          },
        )

        if (!active) {
          controls.stop()
          return
        }

        controlsRef.current = controls
      } catch {
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
          // The scanner may already have been stopped by a successful detection.
        }
      }
    }
  }, [onClose, toast])

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
