"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n"
import { useAppTheme } from "@/components/app-theme-provider"
import { useUser } from "@/hooks/useUser"
import { 
  getUserByUsername, 
  getUserCollectionByUsername, 
  getUserFriends,
  type PublicProfile,
  type UserGame,
  type UserFriend
} from "@/app/actions/users"
import { getRoomTheme } from "@/lib/room-themes"
import { sendFriendRequest, getFriendshipStatus } from "@/app/actions/friends"
import { getOrCreateConversation } from "@/app/actions/marketplace"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  MapPin, 
  Calendar, 
  Users, 
  Gamepad2, 
  Trophy,
  MessageCircle,
  UserPlus,
  Clock,
  CheckCircle,
  Loader2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const t = useTranslations()
  const { currentAppTheme } = useAppTheme()
  const { user: currentUser } = useUser()

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [collection, setCollection] = useState<UserGame[]>([])
  const [friends, setFriends] = useState<UserFriend[]>([])
  const [loading, setLoading] = useState(true)
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [startingChat, setStartingChat] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      console.log("[v0] loadProfile called with username:", username)
      try {
        const [profileResult, collectionResult, friendsResult] = await Promise.all([
          getUserByUsername(username),
          getUserCollectionByUsername(username),
          getUserFriends(username)
        ])

        console.log("[v0] profileResult:", profileResult)

        if (profileResult.profile) {
          setProfile(profileResult.profile)
          setCollection(collectionResult.games || [])
          setFriends(friendsResult.friends || [])

          // Check friendship status if logged in
          if (currentUser && profileResult.profile.id !== currentUser.id) {
            try {
              const status = await getFriendshipStatus(profileResult.profile.id)
              setFriendshipStatus(status?.status ?? null)
            } catch {
              setFriendshipStatus(null)
            }
          }
        }
      } catch (err) {
        console.error('loadProfile error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      loadProfile()
    }
  }, [username, currentUser])

  async function handleSendFriendRequest() {
    if (!profile || !currentUser) return
    setSendingRequest(true)
    const result = await sendFriendRequest(profile.id)
    if (result.success) {
      setFriendshipStatus("pending_sent")
    }
    setSendingRequest(false)
  }

  async function handleStartChat() {
    if (!profile || !currentUser) return
    setStartingChat(true)
    const result = await getOrCreateConversation(profile.id)
    if (result.conversationId) {
      router.push(`/messages?conversation=${result.conversationId}`)
    }
    setStartingChat(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-cinzel font-bold text-foreground mb-2">
            {t("users.notFound")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("users.notFoundDescription")}
          </p>
          <Button asChild variant="outline">
            <Link href="/discover">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("users.backToDiscover")}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id
  const levelProgress = profile.xp ? (profile.xp % 1000) / 10 : 0
  
  // Get the user's theme preview image
  const userTheme = profile.preferred_theme ? getRoomTheme(profile.preferred_theme as string) : null
  const themeImageUrl = userTheme?.image

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - displays user's selected theme preview */}
      <div className="relative h-48 md:h-64">
        {themeImageUrl ? (
          <img 
            src={themeImageUrl} 
            alt={userTheme?.name || "Theme preview"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${currentAppTheme.colors.primary}20, ${currentAppTheme.colors.secondary}20)`
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.username} />
            <AvatarFallback className="text-4xl bg-accent-gold/20 text-accent-gold">
              {(profile.display_name || profile.username || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-cinzel font-bold text-foreground">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {/* Level Badge */}
              {profile.level && (
                <Badge 
                  variant="outline" 
                  className="w-fit border-accent-gold/50 bg-accent-gold/10 text-accent-gold"
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  {t("profile.level")} {profile.level}
                </Badge>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-muted-foreground mt-3 max-w-2xl">
                {profile.bio}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t("users.memberSince")} {new Date(profile.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {currentUser && !isOwnProfile && (
            <div className="flex gap-2">
              {friendshipStatus === "accepted" ? (
                <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t("users.friends")}
                </Badge>
              ) : friendshipStatus === "pending_sent" ? (
                <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {t("users.requestSent")}
                </Badge>
              ) : friendshipStatus === "pending_received" ? (
                <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {t("users.requestReceived")}
                </Badge>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleSendFriendRequest}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {t("users.addFriend")}
                </Button>
              )}
              
              <Button 
                onClick={handleStartChat}
                disabled={startingChat}
                className="bg-accent-gold hover:bg-accent-gold/90 text-accent-gold-foreground"
              >
                {startingChat ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                {t("users.sendMessage")}
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <Button asChild variant="outline">
              <Link href="/profile">
                {t("users.editProfile")}
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="h-6 w-6 mx-auto mb-2 text-accent-gold" />
              <div className="text-2xl font-bold text-foreground">{collection.length}</div>
              <div className="text-xs text-muted-foreground">{t("users.gamesOwned")}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-accent-gold" />
              <div className="text-2xl font-bold text-foreground">{friends.length}</div>
              <div className="text-xs text-muted-foreground">{t("users.friendsCount")}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-accent-gold" />
              <div className="text-2xl font-bold text-foreground">{profile.level || 1}</div>
              <div className="text-xs text-muted-foreground">{t("users.currentLevel")}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="h-6 w-6 mx-auto mb-2 text-accent-gold font-bold">XP</div>
              <div className="text-2xl font-bold text-foreground">{profile.xp || 0}</div>
              <div className="text-xs text-muted-foreground">{t("users.totalXP")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="collection" className="mb-8">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="collection" className="data-[state=active]:bg-accent-gold/20">
              <Gamepad2 className="h-4 w-4 mr-2" />
              {t("users.collection")} ({collection.length})
            </TabsTrigger>
            <TabsTrigger value="friends" className="data-[state=active]:bg-accent-gold/20">
              <Users className="h-4 w-4 mr-2" />
              {t("users.friendsList")} ({friends.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-6">
            {collection.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("users.noGamesYet")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {collection.map((game) => (
                  <Card key={game.id} className="bg-card/50 border-border/50 overflow-hidden group hover:border-accent-gold/50 transition-colors">
                    <div className="aspect-square relative bg-muted">
                      {game.game?.thumbnail_url ? (
                        <img 
                          src={game.game.thumbnail_url} 
                          alt={game.game.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {game.game?.name || "Unknown Game"}
                      </h3>
                      {game.play_count !== undefined && game.play_count > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {game.play_count} {t("users.plays")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="mt-6">
            {friends.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("users.noFriendsYet")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <Link key={friend.id} href={`/users/${friend.username}`}>
                    <Card className="bg-card/50 border-border/50 hover:border-accent-gold/50 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback className="bg-accent-gold/20 text-accent-gold">
                            {(friend.display_name || friend.username || "?")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {friend.display_name || friend.username}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
