import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Trophy, Users, Star, ExternalLink } from "lucide-react"

const activities: any[] = []

export function RecentActivity() {
  return (
    <Card className="room-furniture">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="ornate-text font-heading text-2xl font-bold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm">
          <span className="font-body">View All</span>
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
            >
              <div className={`p-2 rounded-full ${activity.color} flex-shrink-0`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm font-body">{activity.title}</p>
                    <p className="text-sm text-muted-foreground font-body">{activity.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <span className="font-body">{activity.action}</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-body">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
