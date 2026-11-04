"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Compass, Pause, Play, SkipForward, X } from "lucide-react"

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

export function GameTableIntroduction({ locale = "fi" }: { locale?: string }) {
  const language = locale === "en" ? "en" : "fi"
  const copy = scenes[language]
  const [open, setOpen] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const scene = copy[sceneIndex]
  const textVisible = elapsed >= TEXT_DELAY

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
      <button
        type="button"
        onClick={start}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--archive-gold,#d9b65c)]/60 bg-black/35 px-5 py-3 font-cinzel text-xs font-semibold uppercase tracking-[0.14em] text-[var(--archive-gold,#d9b65c)] shadow-lg backdrop-blur-sm transition-all hover:bg-[var(--archive-gold,#d9b65c)]/15 hover:border-[var(--archive-gold,#d9b65c)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
      >
        <Compass className="h-4 w-4" aria-hidden="true" />
        {language === "fi" ? "Tutustu GameTableen" : "Discover GameTable"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] isolate overflow-hidden bg-[#090706] text-white"
          role="dialog"
          aria-modal="true"
          aria-label={language === "fi" ? "Tutustu GameTableen" : "Discover GameTable"}
        >
          <div className="absolute inset-0">
            <Image
              key={scene.image}
              src={scene.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover animate-gametable-scene"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={language === "fi" ? "Sulje esittely" : "Close introduction"}
            className="absolute right-5 top-5 z-20 rounded-full border border-white/30 bg-black/35 p-3 text-white/90 backdrop-blur-md transition hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute left-5 right-5 top-6 z-10 flex gap-2 sm:left-10 sm:right-10 sm:top-8">
            {copy.map((item, index) => (
              <div key={item.eyebrow} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-[var(--archive-gold,#d9b65c)] transition-[width] duration-100"
                  style={{ width: index < sceneIndex ? "100%" : index === sceneIndex ? `${(elapsed / SCENE_DURATION) * 100}%` : "0%" }}
                />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex h-full items-end px-6 pb-[max(7rem,env(safe-area-inset-bottom))] pt-24 sm:px-12 sm:pb-32 lg:px-20">
            <div className="max-w-3xl">
              <p className={`mb-3 font-cinzel text-xs uppercase tracking-[0.24em] text-[var(--archive-gold,#d9b65c)] transition-all duration-1000 ${textVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                {scene.eyebrow}
              </p>
              <h1 className={`font-cinzel text-3xl font-semibold leading-tight drop-shadow-lg transition-all duration-1000 sm:text-5xl lg:text-6xl ${textVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
                {scene.title}
              </h1>
              <div className={`mt-5 max-w-2xl space-y-3 text-base leading-relaxed text-white/90 drop-shadow-md transition-all duration-1000 sm:text-xl ${textVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                <p>{scene.first}</p>
                <p className="text-white/75">{scene.second}</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between sm:bottom-8 sm:left-10 sm:right-10">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/35 px-4 py-2.5 text-sm text-white/90 backdrop-blur-md transition hover:bg-black/60"
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span>{paused ? (language === "fi" ? "Jatka" : "Resume") : (language === "fi" ? "Tauko" : "Pause")}</span>
            </button>
            <div className="flex items-center gap-4">
              <span className="font-cinzel text-xs tracking-widest text-white/65">{sceneIndex + 1} / {copy.length}</span>
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--archive-gold,#d9b65c)]/70 bg-black/45 px-4 py-2.5 font-cinzel text-xs uppercase tracking-wider text-[var(--archive-gold,#d9b65c)] backdrop-blur-md transition hover:bg-[var(--archive-gold,#d9b65c)]/15"
              >
                {sceneIndex === copy.length - 1 ? (language === "fi" ? "Sulje" : "Finish") : (language === "fi" ? "Ohita kohtaus" : "Skip scene")}
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
