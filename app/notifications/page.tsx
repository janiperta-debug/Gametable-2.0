import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, Users, Calendar, Trophy, MessageCircle, Star, Settings } from "lucide-react"

const notifications = [
  {
    id: 1,
    type: "friend_request",
    title: "New Friend Request",
    message: "Sarah Chen wants to connect with you",
    time: "2 hours ago",
    isRead: false,
    icon: Users,
    color: "text-green-600",
    actions: ["Accept", "Decline"],
  },
  {
    id: 2,
    type: "event_invite",
    title: "Event Invitation",
    message: "You've been invited to 'Strategy Game Night' by Mike Johnson",
    time: "4 hours ago",
    isRead: false,
    icon: Calendar,
    color: "text-purple-600",
    actions: ["Join", "Maybe", "Decline"],
  },
  {
    id: 3,
    type: "trophy_earned",
    title: "Trophy Unlocked!",
    message: "You've earned the 'Collection Curator' trophy",
    time: "1 day ago",
    isRead: true,
    icon: Trophy,
    color: "text-accent-gold",
    actions: ["View Trophy"],
  },
  {
    id: 4,
    type: "message",
    title: "New Message",
    message: "Alex Rivera sent you a message about Wingspan",
    time: "2 days ago",
    isRead: true,
    icon: MessageCircle,
    color: "text-blue-600",
    actions: ["Reply"],
  },
  {
    id: 5,
    type: "achievement",
    title: "Level Up!",
    message: "Congratulations! You've reached Level 13",
    time: "3 days ago",
    isRead: true,
    icon: Star,
    color: "text-accent-gold",
    actions: ["View Progress"],
  },
]

export default function NotificationsPage() {
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-3">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Stay updated with your gaming community activities
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="bg-transparent">
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="outline" size="sm" className="bg-transparent">
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          <Button variant="outline" size="sm" className="bg-transparent">
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>

        {/* Notifications List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`room-furniture transition-all duration-200 hover:shadow-md ${
                !notification.isRead
                  ? "border-accent-gold/50 dark:border-accent-gold/30 bg-accent-gold/5 dark:bg-accent-gold/5"
                  : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full bg-background ${notification.color} flex-shrink-0`}>
                    <notification.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-semibold flex items-center">
                          {notification.title}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-accent-gold rounded-full ml-2 flex-shrink-0" />
                          )}
                        </h3>
                        <p className="font-body text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap font-body">
                        {notification.time}
                      </span>
                    </div>
                    {notification.actions && (
                      <div className="flex space-x-2 pt-2">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={index === 0 ? "default" : "outline"}
                            className={index === 0 ? "theme-accent-gold" : "bg-transparent"}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (when no notifications) */}
        {notifications.length === 0 && (
          <Card className="room-furniture max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 text-accent-gold mx-auto mb-4" />
              <h3 className="ornate-text font-heading text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="font-body text-muted-foreground">
                You have no new notifications. Check back later for updates from your gaming community.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings Card */}
        <div className="mt-12">
          <Card className="room-furniture max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-5 w-5 text-accent-gold" />
                <h3 className="font-heading text-lg font-semibold">Notification Preferences</h3>
              </div>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Customize what notifications you receive and how you want to be notified.
              </p>
              <Button variant="outline" className="bg-transparent">
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
