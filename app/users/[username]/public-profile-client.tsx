"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Gamepad2, Star, UserPlus, UserCheck, Clock, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  xp: number | null
  level: number | null
  show_collection: boolean | null
}

interface Game {
  id: string
  name: string
  thumbnail_url: string | null
}

interface PublicProfileClientProps {
  profile: Profile
  gameInterests: string[] | null
  gameCount: number
  games: Game[]
  currentUserId: string | null
  initialFriendshipStatus: "none" | "pending" | "accepted" | "incoming"
}

export function PublicProfileClient({
  profile,
  gameInterests,
  gameCount,
  games,
  currentUserId,
  initialFriendshipStatus,
}: PublicProfileClientProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [friendshipStatus, setFriendshipStatus] = useState(initialFriendshipStatus)
  const [loading, setLoading] = useState(false)

  const isOwnProfile = currentUserId === profile.id
  const displayName = profile.display_name || profile.username || "Anonymous"

  async function sendFriendRequest() {
    if (!currentUserId) return
    
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      addressee_id: profile.id,
      status: "pending"
    })
    
    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      })
    } else {
      setFriendshipStatus("pending")
      toast({
        title: t("common.success"),
        description: t("friends.requestSent"),
      })
    }
    setLoading(false)
  }

  async function acceptFriendRequest() {
    if (!currentUserId) return
    
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("requester_id", profile.id)
      .eq("addressee_id", currentUserId)
    
    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      })
    } else {
      setFriendshipStatus("accepted")
      toast({
        title: t("common.success"),
        description: t("friends.requestAccepted"),
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 text-muted-foreground hover:text-foreground"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

        {/* Profile Header */}
        <Card className="border-accent-gold/30 bg-card/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 border-2 border-accent-gold">
                <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-accent-gold/20 text-accent-gold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-heading text-accent-gold mb-1">
                  {displayName}
                </h1>
                {profile.username && profile.display_name && (
                  <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>
                )}
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground mb-3">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-accent-gold" />
                    {t("profile.level")} {profile.level || 1}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="h-4 w-4" />
                    {gameCount} {t("collection.games")}
                  </span>
                </div>

                {profile.bio && (
                  <p className="text-foreground/80 mb-4">{profile.bio}</p>
                )}

                {/* Game Interests */}
                {gameInterests && gameInterests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {gameInterests.map((interest) => (
                      <Badge key={interest} variant="outline" className="border-accent-gold/30">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Friend Actions */}
                {!isOwnProfile && currentUserId && (
                  <div className="mt-4">
                    {friendshipStatus === "none" && (
                      <Button
                        onClick={sendFriendRequest}
                        disabled={loading}
                        className="bg-accent-gold hover:bg-accent-gold/90 text-background"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {t("friends.sendRequest")}
                      </Button>
                    )}
                    {friendshipStatus === "pending" && (
                      <Button variant="outline" disabled className="border-accent-gold/30">
                        <Clock className="h-4 w-4 mr-2" />
                        {t("friends.requestPending")}
                      </Button>
                    )}
                    {friendshipStatus === "incoming" && (
                      <Button
                        onClick={acceptFriendRequest}
                        disabled={loading}
                        className="bg-accent-gold hover:bg-accent-gold/90 text-background"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        {t("friends.acceptRequest")}
                      </Button>
                    )}
                    {friendshipStatus === "accepted" && (
                      <Button variant="outline" disabled className="border-accent-gold/30 text-accent-gold">
                        <UserCheck className="h-4 w-4 mr-2" />
                        {t("friends.alreadyFriends")}
                      </Button>
                    )}
                  </div>
                )}

                {isOwnProfile && (
                  <Link href="/profile">
                    <Button variant="outline" className="border-accent-gold/30 mt-4">
                      {t("profile.editProfile")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Collection Preview */}
        {profile.show_collection !== false && games.length > 0 && (
          <Card className="border-accent-gold/30 bg-card/50">
            <CardHeader>
              <CardTitle className="text-accent-gold font-heading flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                {t("collection.title")} ({gameCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {games.map((game) => (
                  <div key={game.id} className="aspect-square relative rounded-lg overflow-hidden bg-accent-gold/10">
                    {game.thumbnail_url ? (
                      <Image
                        src={game.thumbnail_url}
                        alt={game.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="h-8 w-8 text-accent-gold/50" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Collection Message */}
        {profile.show_collection === false && (
          <Card className="border-accent-gold/30 bg-card/50">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("profile.collectionHidden")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
