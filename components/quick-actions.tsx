import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Users, MessageSquare } from "lucide-react"

const actions = [
  {
    title: "Add Game",
    description: "Add to collection",
    icon: Plus,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    title: "Create Event",
    description: "Host game night",
    icon: Calendar,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  {
    title: "Find Players",
    description: "Connect with gamers",
    icon: Users,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  {
    title: "Messages",
    description: "Chat with friends",
    icon: MessageSquare,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
]

export function QuickActions() {
  return (
    <Card className="room-furniture">
      <CardHeader>
        <CardTitle className="text-xl font-charm ornate-text">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <Button key={action.title} variant="outline" className={`w-full justify-start h-auto p-4 ${action.color}`}>
              <action.icon className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-cinzel font-medium">{action.title}</div>
                <div className="text-xs font-merriweather opacity-70">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
