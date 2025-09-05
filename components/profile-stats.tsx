import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, Calendar, Trophy } from "lucide-react"

const stats = [
  {
    title: "Games Owned",
    value: 247,
    goal: 300,
    progress: 82,
    change: "+12 this month",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    title: "Gaming Friends",
    value: 38,
    goal: 50,
    progress: 76,
    change: "+3 new friends",
    icon: Users,
    color: "text-green-500",
  },
  {
    title: "Events Hosted",
    value: 15,
    goal: 25,
    progress: 60,
    change: "+5 this month",
    icon: Calendar,
    color: "text-purple-500",
  },
  {
    title: "Trophies Earned",
    value: 23,
    goal: 50,
    progress: 46,
    change: "+2 this week",
    icon: Trophy,
    color: "text-amber-500",
  },
]

export function ProfileStats() {
  return (
    <Card className="room-furniture">
      <CardHeader>
        <CardTitle className="text-2xl font-charm ornate-text">Gaming Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat) => (
            <div key={stat.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="font-cinzel text-sm text-muted-foreground">{stat.title}</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-accent-gold">{stat.value}</span>
                      <span className="text-sm text-muted-foreground">/ {stat.goal} goal</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={stat.progress} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{stat.progress}% complete</span>
                  <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
