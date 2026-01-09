import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, Gamepad2 } from "lucide-react"

export function FriendActivity() {
  const activities: any[] = []

  return (
    <Card className="room-furniture">
      <CardHeader>
        <CardTitle className="text-xl font-merriweather">Friend Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground font-merriweather">No friend activity yet.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-dark/50 border border-accent-gold/10"
            >
              <Avatar className="h-8 w-8 border border-accent-gold/20">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback className="bg-accent-gold/10 text-accent-gold text-xs font-cinzel">
                  {activity.user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-merriweather">
                  <span className="font-medium text-accent-gold">{activity.user.name}</span> {activity.action}{" "}
                  <span className="font-medium">{activity.game}</span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </p>
              </div>
              <Badge variant="outline" className="border-accent-gold/20 text-accent-gold">
                <activity.icon className="h-3 w-3 mr-1" />
                {activity.type}
              </Badge>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
