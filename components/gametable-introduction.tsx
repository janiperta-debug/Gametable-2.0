"use client"

import Image from "next/image"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { Compass, Pause, Play, SkipForward, X } from "lucide-react"
import { ArchiveFrame } from "@/components/archive-frame"

type Scene = {
  image: string
  eyebrow: string
  title: string
  first: string
  second: string
}

const scenes: Record<"fi" | "en", Scene[]> = {
  fi: [
    {
      image: "/images/themes/main-hall-hero.jpg",
      eyebrow: "Tervetuloa GameTableen",
      title: "Pelaamisen yhteinen maailma",
      first: "GameTable kokoaa pöytäpelaajat, pelit ja pelikokemukset saman katon alle.",
      second: "Löydä uusia pelejä, kokoa oma kokoelmasi ja kohtaa muita pelaajia.",
    },
    {
      image: "/images/heroes/collection/library.jpg",
      eyebrow: "Oma pelikokoelmasi",
      title: "Pidä pelisi järjestyksessä",
      first: "Kokoa lautapelit, roolipelit ja korttipelit yhteen paikkaan.",
      second: "Seuraa kokoelmaasi ja säilytä muistoja pelatuista peleistä.",
    },
    {
      image: "/images/heroes/discover/bar.jpg",
      eyebrow: "Pelaajat ja yhteisö",
      title: "Löydä seuraa pelaamiseen",
      first: "Tutustu muihin pelaajiin ja löydä ihmisiä, joita kiinnostavat samat pelit.",
      second: "Pelaaminen on hauskempaa, kun kokemukset voi jakaa muiden kanssa.",
    },
    {
      image: "/images/heroes/events/ballroom.jpg",
      eyebrow: "Tapahtumat",
      title: "Pelihetkistä yhteisiä tapahtumia",
      first: "Löydä pelitapahtumia ja lähde mukaan järjestettyyn pelaamiseen.",
      second: "Osallistu turnauksiin ja liigoihin tai tuo oma tapahtumasi yhteisön löydettäväksi.",
    },
    {
      image: "/images/heroes/trophies/main-hall.jpg",
      eyebrow: "Saavutukset ja eteneminen",
      title: "Jokainen pelikerta jättää jäljen",
      first: "Kerää kokemusta, avaa saavutuksia ja ansaitse pokaaleja.",
      second: "Kehitä omaa kartanoasi ja avaa uusia huoneita pelaamisen myötä.",
    },
  ],
  en: [
    {
      image: "/images/themes/main-hall-hero.jpg",
      eyebrow: "Welcome to GameTable",
      title: "A shared world of tabletop gaming",
      first: "GameTable brings players, games and gaming experiences together.",
      second: "Discover games, build your collection and meet fellow players.",
    },
    {
      image: "/images/heroes/collection/library.jpg",
      eyebrow: "Your game collection",
      title: "Keep your games in order",
      first: "Bring your board games, role-playing games and card games together.",
      second: "Explore your collection and keep a record of the games you play.",
    },
    {
      image: "/images/heroes/discover/bar.jpg",
      eyebrow: "Players and community",
      title: "Find people to play with",
      first: "Meet other players and connect over the games you enjoy.",
      second: "Gaming is even better when you can share the experience.",
    },
    {
      image: "/images/heroes/events/ballroom.jpg",
      eyebrow: "Events",
      title: "Turn game nights into shared events",
      first: "Discover gaming events and join organised play.",
      second: "Take part in tournaments and leagues, or share an event of your own.",
    },
    {
      image: "/images/heroes/trophies/main-hall.jpg",
      eyebrow: "Achievements and progress",
      title: "Every game leaves its mark",
      first: "Earn experience, unlock achievements and collect trophies.",
      second: "Grow your manor and unlock new rooms as you play.",
    },
  ],
}

const SCENE_DURATION = 11000
const TEXT_DELAY = 2200

export function GameTableIntroduction({ locale = "fi", showTrigger = true }: { locale?: string; showTrigger?: boolean }) {
  const language = locale === "en" ? "en" : "fi"
  const copy = scenes[language]
  const [open, setOpen] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [textVisible, setTextVisible] = useState(false)
  const scene = copy[sceneIndex]

  useEffect(() => {
    if (!open) return
    setTextVisible(false)
    const revealTimer = window.setTimeout(() => setTextVisible(true), TEXT_DELAY)
    return () => window.clearTimeout(revealTimer)
  }, [open, sceneIndex])

  useEffect(() => {
    if (typeof window === "undefined") return
    const launch = () => {
      setSceneIndex(0)
      setElapsed(0)
      setPaused(false)
      setOpen(true)
      window.history.replaceState({}, "", window.location.pathname + window.location.hash)
    }
    if (window.location.search.includes("intro=1")) launch()
    window.addEventListener("gametable:open-introduction", launch)
    return () => window.removeEventListener("gametable:open-introduction", launch)
  }, [])

  useEffect(() => {
    if (!open || paused) return
    const timer = window.setInterval(() => {
      setElapsed((current) => {
        if (current + 100 >= SCENE_DURATION) {
          setSceneIndex((index) => (index + 1) % copy.length)
          return 0
        }
        return current + 100
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [open, paused, copy.length])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault()
        setPaused((value) => !value)
      }
      if (event.key === "ArrowRight") {
        setSceneIndex((index) => Math.min(index + 1, copy.length - 1))
        setElapsed(0)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKey)
    }
  }, [open, copy.length])

  const start = () => {
    setSceneIndex(0)
    setElapsed(0)
    setPaused(false)
    setOpen(true)
  }

  const next = () => {
    if (sceneIndex === copy.length - 1) {
      setOpen(false)
      return
    }
    setSceneIndex((index) => index + 1)
    setElapsed(0)
  }

  return (
    <>
      {showTrigger && <button
        type="button"
        onClick={start}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--archive-gold,#d9b65c)]/60 bg-black/35 px-5 py-3 font-cinzel text-xs font-semibold uppercase tracking-[0.14em] text-[var(--archive-gold,#d9b65c)] shadow-lg backdrop-blur-sm transition-all hover:bg-[var(--archive-gold,#d9b65c)]/15 hover:border-[var(--archive-gold,#d9b65c)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
      >
        <Compass className="h-4 w-4" aria-hidden="true" />
        {language === "fi" ? "Tutustu GameTableen" : "Discover GameTable"}
      </button>}

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/85 px-3 pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] text-white backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={language === "fi" ? "Tutustu GameTableen" : "Discover GameTable"}
        >
          <ArchiveFrame
            weight="regular"
            cornerSize="md"
            className="h-[min(88dvh,850px)] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-24px)] w-full max-w-5xl"
          >
            <div className="relative flex h-full min-h-0 flex-col bg-[#090706]">
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <Image
                  key={scene.image}
                  src={scene.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 768px) 94vw, 960px"
                  className="object-cover animate-gametable-scene"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/90" />
                <div className="absolute inset-x-4 top-4 z-20 flex items-center gap-2 sm:inset-x-7 sm:top-6">
                  <div className="flex flex-1 gap-1.5">
                    {copy.map((item, index) => (
                      <div key={item.eyebrow} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                        <div
                          className="h-full bg-[var(--archive-gold,#d9b65c)] transition-[width] duration-100"
                          style={{ width: index < sceneIndex ? "100%" : index === sceneIndex ? `${(elapsed / SCENE_DURATION) * 100}%` : "0%" }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={language === "fi" ? "Sulje esittely" : "Close introduction"}
                    className="ml-2 rounded-full border border-white/35 bg-black/45 p-2.5 text-white backdrop-blur-md transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-24 sm:px-10 sm:pb-10 sm:pt-32">
                  <div className="mx-auto max-w-3xl text-center sm:text-left">
                    <p className={`mb-2 font-cinzel text-[10px] uppercase tracking-[0.22em] text-[var(--archive-gold,#d9b65c)] transition-all duration-700 sm:text-xs ${textVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                      {scene.eyebrow}
                    </p>
                    <h1 className={`font-cinzel text-2xl font-semibold leading-tight drop-shadow-lg transition-all duration-700 sm:text-4xl lg:text-5xl ${textVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                      {scene.title}
                    </h1>
                    <div className={`mx-auto mt-3 max-w-2xl space-y-2 text-sm leading-relaxed text-white/95 drop-shadow-md transition-all duration-700 sm:mx-0 sm:mt-5 sm:text-lg ${textVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                      <p>{scene.first}</p>
                      <p className="text-white/75">{scene.second}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--archive-gold,#d9b65c)]/35 bg-[#1b1009] px-4 py-3 sm:px-7 sm:py-4">
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-sm text-white/90 transition hover:bg-black/60"
                >
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span>{paused ? (language === "fi" ? "Jatka" : "Resume") : (language === "fi" ? "Tauko" : "Pause")}</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-cinzel text-xs tracking-widest text-white/65">{sceneIndex + 1} / {copy.length}</span>
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--archive-gold,#d9b65c)]/70 bg-black/45 px-4 py-2 font-cinzel text-xs uppercase tracking-wider text-[var(--archive-gold,#d9b65c)] transition hover:bg-[var(--archive-gold,#d9b65c)]/15"
                  >
                    {sceneIndex === copy.length - 1 ? (language === "fi" ? "Sulje" : "Finish") : (language === "fi" ? "Seuraava" : "Next")}
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </ArchiveFrame>
        </div>,
        document.body,
      )}
    </>
  )
}
