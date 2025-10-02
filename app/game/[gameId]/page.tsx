import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Users, Clock, Calendar, Heart, ArrowLeft, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { MOCK_GAMES } from "@/lib/mock-games"
import { DISCOVER_GAMES } from "@/lib/discover-games"

interface GameDetailPageProps {
  params: Promise<{ gameId: string }>
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { gameId } = await params

  const collectionGame = MOCK_GAMES.find((g) => g.id === Number.parseInt(gameId))
  const discoverGame = DISCOVER_GAMES.find((g) => g.id === Number.parseInt(gameId))

  // Normalize the game data structure
  const game =
    collectionGame ||
    (discoverGame
      ? {
          ...discoverGame,
          owned: false,
          wishlist: false,
          minPlayers: Number.parseInt(discoverGame.playerCount.split("-")[0]),
          maxPlayers: Number.parseInt(discoverGame.playerCount.split("-")[1] || discoverGame.playerCount.split("-")[0]),
          minPlayTime: Number.parseInt(discoverGame.playTime.split("-")[0]),
          maxPlayTime: Number.parseInt(discoverGame.playTime.split("-")[1] || discoverGame.playTime.split("-")[0]),
        }
      : null)

  if (!game) {
    return (
      <div className="min-h-screen room-environment">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="ornate-text font-heading text-4xl font-bold mb-4">Game Not Found</h1>
            <p className="text-muted-foreground font-body mb-6">
              The game you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/collection">
              <Button className="theme-accent-gold">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collection
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/collection">
            <Button variant="ghost" className="font-body hover:text-accent-gold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collection
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Game Image */}
          <div className="lg:col-span-1">
            <Card className="picture-frame overflow-hidden sticky top-8">
              <div className="aspect-[3/4] relative bg-surface/50">
                <Image src={game.image || "/placeholder.svg"} alt={game.title} fill className="object-cover" />
                {game.wishlist && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-accent-gold/90 text-background">
                      <Heart className="h-4 w-4 mr-1 fill-current" />
                      Wishlist
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Game Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="ornate-text font-heading text-5xl font-bold mb-4">{game.title}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 fill-accent-gold text-accent-gold" />
                  <span className="text-2xl font-bold">{game.rating}</span>
                  <span className="text-muted-foreground font-body">/ 5.0</span>
                </div>
                <Badge variant="outline" className="text-base border-accent-gold/20 text-accent-gold px-4 py-1">
                  {game.category}
                </Badge>
              </div>
            </div>

            {/* Quick Stats */}
            <Card className="room-furniture">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span className="font-body text-sm">Players</span>
                    </div>
                    <p className="font-heading text-2xl font-bold">{game.playerCount}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span className="font-body text-sm">Play Time</span>
                    </div>
                    <p className="font-heading text-2xl font-bold">{game.playTime} min</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                      <span className="font-body text-sm">Published</span>
                    </div>
                    <p className="font-heading text-2xl font-bold">{game.yearPublished}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-5 w-5" />
                      <span className="font-body text-sm">Rating</span>
                    </div>
                    <p className="font-heading text-2xl font-bold">{game.rating}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mechanics */}
            <Card className="room-furniture">
              <CardContent className="p-6">
                <h2 className="ornate-text font-heading text-2xl font-bold mb-4">Game Mechanics</h2>
                <div className="flex flex-wrap gap-2">
                  {game.mechanics.map((mechanic) => (
                    <Badge
                      key={mechanic}
                      variant="secondary"
                      className="font-body text-sm px-3 py-1 bg-accent-gold/10 text-accent-gold border border-accent-gold/20"
                    >
                      {mechanic
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="room-furniture">
              <CardContent className="p-6">
                <h2 className="ornate-text font-heading text-2xl font-bold mb-4">About This Game</h2>
                <p className="font-body text-muted-foreground leading-relaxed">
                  This is a placeholder description for {game.title}. In a full implementation, this would contain
                  detailed information about the game's theme, gameplay, objectives, and what makes it unique. The
                  description would be fetched from BoardGameGeek, RPGGeek, or other external databases based on the
                  game type.
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="room-furniture">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {game.owned ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove from Collection
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 ${
                          game.wishlist
                            ? "border-accent-gold text-accent-gold hover:bg-accent-gold/10"
                            : "border-muted-foreground/50 hover:border-accent-gold hover:text-accent-gold"
                        }`}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${game.wishlist ? "fill-current" : ""}`} />
                        {game.wishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="flex-1 theme-accent-gold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Collection
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 ${
                          game.wishlist
                            ? "border-accent-gold text-accent-gold hover:bg-accent-gold/10"
                            : "border-muted-foreground/50 hover:border-accent-gold hover:text-accent-gold"
                        }`}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${game.wishlist ? "fill-current" : ""}`} />
                        {game.wishlist ? "On Wishlist" : "Add to Wishlist"}
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-body mt-4 text-center">
                  {game.owned ? "This game is in your collection" : "Add this game to your collection to track it"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
