"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArchiveButton,
  ArchiveCard,
  ArchiveCardButton,
  ArchiveCardContent,
} from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, Users, Calendar, Trophy, MessageCircle, Star, Settings, Loader2, UserCheck } from "lucide-react"
import { ThemeHero } from "@/components/theme-hero"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  type Notification 
} from "@/app/actions/notifications"
import { acceptFriendRequest, rejectFriendRequest } from "@/app/actions/friends"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

const iconMap: Record<string, React.ElementType> = {
  friend_request: Users,
  friend_accepted: UserCheck,
  event_invite: Calendar,
  event_reminder: Calendar,
  badge_earned: Trophy,
  message: MessageCircle,
  system: Star,
}

const colorMap: Record<string, string> = {
  friend_request: "text-green-600",
  friend_accepted: "text-green-600",
  event_invite: "text-purple-600",
  event_reminder: "text-purple-600",
  badge_earned: "text-accent-gold",
  message: "text-blue-600",
  system: "text-accent-gold",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const t = useTranslations()
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    async function loadNotifications() {
      if (!user) {
        setLoading(false)
        return
      }
      const result = await getNotifications()
      if (!result.error) {
        setNotifications(result.data)
      }
      setLoading(false)
    }
    loadNotifications()

    // Subscribe to new notifications
    if (!user) return

    const supabase = createClient()
    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n))
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function handleMarkAllRead() {
    const result = await markAllNotificationsAsRead()
    if (!result.error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast({ title: t("common.success"), description: t("notifications.allMarkedRead") })
    }
  }

  async function handleClearAll() {
    // Delete all notifications one by one
    for (const n of notifications) {
      await deleteNotification(n.id)
    }
    setNotifications([])
    toast({ title: t("common.success"), description: t("notifications.allCleared") })
  }

  async function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
    }

    // Navigate based on type
    const data = notification.data as Record<string, string> || {}
    switch (notification.type) {
      case "friend_request":
        router.push("/profile#friends")
        break
      case "friend_accepted":
        if (data.friend_id) router.push(`/profile/${data.friend_id}`)
        break
      case "event_invite":
      case "event_reminder":
        if (data.event_id) router.push(`/events/${data.event_id}`)
        else router.push("/events")
        break
      case "badge_earned":
        router.push("/trophies")
        break
      case "message":
        router.push("/messages")
        break
    }
  }

  async function handleAcceptFriendRequest(notification: Notification) {
    const data = notification.data as Record<string, string> || {}
    if (!data.friendship_id) return
    
    setActionLoading(notification.id)
    const result = await acceptFriendRequest(data.friendship_id)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      toast({ title: t("common.success"), description: t("profile.friendRequestAccepted") })
      await deleteNotification(notification.id)
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }
    setActionLoading(null)
  }

  async function handleDeclineFriendRequest(notification: Notification) {
    const data = notification.data as Record<string, string> || {}
    if (!data.friendship_id) return
    
    setActionLoading(notification.id)
    const result = await rejectFriendRequest(data.friendship_id)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      toast({ title: t("common.success"), description: t("profile.friendRequestRejected") })
      await deleteNotification(notification.id)
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }
    setActionLoading(null)
  }

  if (!user) {
    return (
      <div className="min-h-screen room-environment">
        <main className="container mx-auto px-4 py-8">
          <ThemeHero page="notifications" mode="backdrop">
            <div className="text-center">
              <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                {t("notifications.title")}
              </h1>
              <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {t("notifications.subtitle")}
              </p>
            </div>
          </ThemeHero>
          <ArchiveCard className="max-w-2xl mx-auto">
            <ArchiveCardContent className="p-12 text-center">
              <Bell className="h-16 w-16 text-accent-gold mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">{t("notifications.loginRequired")}</h3>
              <p className="font-body text-muted-foreground">{t("notifications.loginToView")}</p>
            </ArchiveCardContent>
          </ArchiveCard>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <ThemeHero page="notifications" mode="backdrop">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                {t("notifications.title")}
              </h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount} {t("common.new")}
                </Badge>
              )}
            </div>
            <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {t("notifications.subtitle")}
            </p>
          </div>
        </ThemeHero>

        {/* Action Bar */}
        <div className="flex justify-center sm:justify-start items-center mb-8">
          <div className="flex flex-wrap gap-2">
            <ArchiveButton
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              icon={<Check className="h-4 w-4" />}
            >
              {t("notifications.markAllRead")}
            </ArchiveButton>
            <ArchiveButton
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              icon={<X className="h-4 w-4" />}
            >
              {t("notifications.clearAll")}
            </ArchiveButton>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <ArchiveCard className="max-w-2xl mx-auto">
            <ArchiveCardContent className="p-12 text-center">
              <Bell className="h-16 w-16 text-accent-gold mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">{t("notifications.allCaughtUp")}</h3>
              <p className="font-body text-muted-foreground">{t("notifications.noNotifications")}</p>
            </ArchiveCardContent>
          </ArchiveCard>
        ) : (
          /* Notifications List - single frame, rows separated by dividers */
          <div className="max-w-4xl mx-auto">
            <ArchiveCard>
              <ArchiveCardContent className="p-0">
                {notifications.map((notification) => {
                  const IconComponent = iconMap[notification.type] || Bell
                  const iconColor = colorMap[notification.type] || "text-accent-gold"
                  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

                  return (
                    <div
                      key={notification.id}
                      className={`relative flex items-start gap-4 p-6 cursor-pointer transition-colors border-b border-accent-gold/15 last:border-b-0 hover:bg-accent-gold/5 ${
                        !notification.read ? "bg-accent-gold/[0.07]" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {!notification.read && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent-gold" />
                      )}
                      <div className={`p-2 rounded-full bg-black/30 ${iconColor} flex-shrink-0`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-heading font-semibold flex items-center">
                              {notification.title}
                              {!notification.read && (
                                <span className="w-2 h-2 bg-accent-gold rounded-full ml-2 flex-shrink-0" />
                              )}
                            </h3>
                            <p className="font-body text-sm text-muted-foreground mt-1 break-words">{notification.body}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap font-body">
                            {timeAgo}
                          </span>
                        </div>
                        {notification.type === "friend_request" && (
                          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                            <ArchiveCardButton
                              active
                              onClick={() => handleAcceptFriendRequest(notification)}
                              disabled={actionLoading === notification.id}
                              icon={actionLoading === notification.id ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                            >
                              {t("profile.accept")}
                            </ArchiveCardButton>
                            <ArchiveCardButton
                              onClick={() => handleDeclineFriendRequest(notification)}
                              disabled={actionLoading === notification.id}
                            >
                              {t("profile.decline")}
                            </ArchiveCardButton>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </ArchiveCardContent>
            </ArchiveCard>
          </div>
        )}
      </main>
    </div>
  )
}
