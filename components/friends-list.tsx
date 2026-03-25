"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"
import { 
  getFriends, 
  getPendingRequests, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend,
  type UserProfile,
  type FriendRequest 
} from "@/app/actions/friends"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, Check, X, Users } from "lucide-react"

export function FriendsList() {
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const t = useTranslations()
  const { user } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false)
        return
      }
      const [friendsResult, requestsResult] = await Promise.all([
        getFriends(),
        getPendingRequests()
      ])
      if (!friendsResult.error) setFriends(friendsResult.data)
      if (!requestsResult.error) setPendingRequests(requestsResult.data)
      setLoading(false)
    }
    loadData()
  }, [user])

  async function handleAccept(request: FriendRequest) {
    setActionLoading(request.id)
    const result = await acceptFriendRequest(request.id)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      toast({ title: t("common.success"), description: t("profile.friendRequestAccepted") })
      // Move from pending to friends
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      if (request.requester) {
        setFriends(prev => [...prev, request.requester as UserProfile])
      }
    }
    setActionLoading(null)
  }

  async function handleReject(request: FriendRequest) {
    setActionLoading(request.id)
    const result = await rejectFriendRequest(request.id)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      toast({ title: t("common.success"), description: t("profile.friendRequestRejected") })
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
    }
    setActionLoading(null)
  }

  async function handleRemoveFriend(friendId: string) {
    // We need to find the friendship ID - for now just refresh data
    toast({ title: t("common.error"), description: "Remove friend not implemented yet", variant: "destructive" })
  }

  if (loading) {
    return (
      <div className="room-furniture p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="room-furniture p-8 space-y-6">
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent-gold" />
            <h3 className="text-xl text-accent-gold">{t("profile.pendingRequests")}</h3>
            <Badge className="bg-accent-gold text-background">{pendingRequests.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((request) => {
              const requester = request.requester
              const displayName = requester?.display_name || requester?.username || "Unknown"
              const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
              
              return (
                <div
                  key={request.id}
                  className="p-5 bg-background/40 border border-accent-gold/30 rounded-lg"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={requester?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-accent-gold/20 text-accent-gold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-merriweather text-foreground text-lg block">{displayName}</span>
                      {requester?.location && (
                        <span className="text-sm text-muted-foreground">{requester.location}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-accent-gold hover:bg-accent-copper"
                      onClick={() => handleAccept(request)}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          {t("profile.accept")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-400/40 text-red-400 hover:bg-red-400/10 bg-transparent"
                      onClick={() => handleReject(request)}
                      disabled={actionLoading === request.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t("profile.decline")}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Friends List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent-gold" />
            <h2 className="text-3xl text-accent-gold">{t("profile.friends")} ({friends.length})</h2>
          </div>
        </div>

        {friends.length === 0 ? (
          <p className="text-muted-foreground font-merriweather">{t("profile.noFriendsYet")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => {
              const displayName = friend.display_name || friend.username || "Unknown"
              const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
              
              return (
                <div
                  key={friend.id}
                  className="p-5 bg-background/40 border border-accent-gold/30 rounded-lg hover:border-accent-gold/50 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={friend.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-accent-gold/20 text-accent-gold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-merriweather text-foreground text-lg block">{displayName}</span>
                      {friend.location && (
                        <span className="text-sm text-muted-foreground">{friend.location}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/users/${friend.username}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-accent-gold/40 text-accent-gold hover:bg-accent-gold/10 bg-transparent"
                      >
                        {t("profile.viewProfile")}
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-sm font-merriweather text-accent-gold/60 italic pt-2">
        {t("profile.friendsNote")}
      </p>
    </div>
  )
}
