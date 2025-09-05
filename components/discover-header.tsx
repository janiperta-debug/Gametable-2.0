import { Compass } from "lucide-react"

export function DiscoverHeader() {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center mb-4">
        <Compass className="h-8 w-8 text-accent-gold mr-3" />
        <h1 className="text-5xl font-charm ornate-text">Discover</h1>
      </div>
      <p className="text-xl font-merriweather text-muted-foreground max-w-3xl mx-auto">
        Find new games and connect with fellow adventurers in your tabletop journey.
      </p>
    </div>
  )
}
