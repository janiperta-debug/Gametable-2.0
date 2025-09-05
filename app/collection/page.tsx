import { CollectionHeader } from "@/components/collection-header"
import { CollectionFilters } from "@/components/collection-filters"
import { GameGrid } from "@/components/game-grid"
import { BookOpen } from "lucide-react"

export default function Collection() {
  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Clean Header - Matching Themes Page Style */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Game Collection</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Manage and explore your personal tabletop gaming library
          </p>
        </div>

        <CollectionHeader />
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <CollectionFilters />
          </div>
          <div className="lg:col-span-3">
            <GameGrid />
          </div>
        </div>
      </main>
    </div>
  )
}
