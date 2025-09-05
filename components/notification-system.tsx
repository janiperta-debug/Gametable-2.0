"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, X, Users, Trophy, MessageCircle, Calendar, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Notification {
  id: string
  type: "friend_request" | "trophy_earned" | "message" | "event_invite" | "achievement" | "system"
  title: string
  message: string
  time: string
  isRead: boolean
  actions?: Array<{
    label: string
    variant: "default" | "outline" | "destructive"
    onClick: () => void
  }>
  icon?: React.ComponentType<{ className?: string }>
  priority: "low" | "medium" | "high"
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "friend_request",
    title: "New Friend Request",
    message: "Sarah Chen wants to connect with you",
    time: "2 hours ago",
    isRead: false,
    priority: "high",
    icon: Users,
    actions: [
      { label: "Accept", variant: "default", onClick: () => console.log("Accept friend") },
      { label: "Decline", variant: "outline", onClick: () => console.log("Decline friend") },
    ],
  },
  {
    id: "2",
    type: "trophy_earned",
    title: "Trophy Unlocked!",
    message: "You've earned the 'Collection Curator' trophy for owning 250+ games",
    time: "4 hours ago",
    isRead: false,
    priority: "medium",
    icon: Trophy,
    actions: [{ label: "View Trophy", variant: "default", onClick: () => console.log("View trophy") }],
  },
  {
    id: "3",
    type: "message",
    title: "New Message",
    message: "Alex Rivera: 'Want to play Wingspan tonight?'",
    time: "6 hours ago",
    isRead: true,
    priority: "medium",
    icon: MessageCircle,
    actions: [{ label: "Reply", variant: "default", onClick: () => console.log("Reply to message") }],
  },
  {
    id: "4",
    type: "event_invite",
    title: "Event Invitation",
    message: "You've been invited to 'D&D Campaign Night' by Mike Johnson",
    time: "1 day ago",
    isRead: false,
    priority: "medium",
    icon: Calendar,
    actions: [
      { label: "Accept", variant: "default", onClick: () => console.log("Accept event") },
      { label: "Maybe", variant: "outline", onClick: () => console.log("Maybe event") },
      { label: "Decline", variant: "outline", onClick: () => console.log("Decline event") },
    ],
  },
  {
    id: "5",
    type: "achievement",
    title: "Level Up!",
    message: "Congratulations! You've reached Level 13",
    time: "2 days ago",
    isRead: true,
    priority: "high",
    icon: Star,
  },
]

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (notification: Notification) => {
    const IconComponent = notification.icon || Bell
    const colorMap = {
      friend_request: "text-green-500",
      trophy_earned: "text-amber-500",
      message: "text-blue-500",
      event_invite: "text-purple-500",
      achievement: "text-accent-gold",
      system: "text-gray-500",
    }
    return <IconComponent className={cn("h-5 w-5", colorMap[notification.type])} />
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-accent-gold hover:text-accent-gold/80"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 z-50">
            <Card className="room-furniture shadow-lg">
              <div className="p-4 border-b border-accent-gold/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                        Mark all read
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-body text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-accent-gold/10">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-accent-gold/5 transition-colors",
                          !notification.isRead && "bg-accent-gold/10",
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-heading font-semibold text-sm flex items-center">
                                  {notification.title}
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-accent-gold rounded-full ml-2 flex-shrink-0" />
                                  )}
                                </h4>
                                <p className="font-body text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="font-body text-xs text-muted-foreground mt-2">{notification.time}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeNotification(notification.id)}
                                className="text-muted-foreground hover:text-foreground ml-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            {notification.actions && (
                              <div className="flex space-x-2 mt-3">
                                {notification.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    size="sm"
                                    variant={action.variant}
                                    onClick={() => {
                                      action.onClick()
                                      markAsRead(notification.id)
                                    }}
                                    className={cn(
                                      "text-xs",
                                      action.variant === "default" && "theme-accent-gold",
                                      action.variant === "outline" && "bg-transparent",
                                    )}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-accent-gold/20 text-center">
                  <Button variant="ghost" size="sm" className="text-accent-gold hover:text-accent-gold/80">
                    View All Notifications
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// Toast notification component for real-time notifications
export function NotificationToast({
  notification,
  onClose,
}: {
  notification: Notification
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <Card className="room-furniture shadow-lg max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {notification.icon && <notification.icon className="h-5 w-5 text-accent-gold" />}
          </div>
          <div className="flex-1">
            <h4 className="font-heading font-semibold text-sm">{notification.title}</h4>
            <p className="font-body text-sm text-muted-foreground mt-1">{notification.message}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
