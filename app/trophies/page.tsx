import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Crown, Star, Award, Target, Users, Calendar, BookOpen, Zap, Shield } from "lucide-react"

const earnedTrophies = [
  {
    id: 1,
    title: "Collection Curator",
    description: "Own 250+ games in your collection",
    icon: BookOpen,
    rarity: "Gold",
    earnedDate: "2 days ago",
    points: 500,
    category: "Collection",
  },
  {
    id: 2,
    title: "Social Butterfly",
    description: "Connect with 25+ fellow gamers",
    icon: Users,
    rarity: "Silver",
    earnedDate: "1 week ago",
    points: 300,
    category: "Social",
  },
  {
    id: 3,
    title: "Event Master",
    description: "Host 10 successful gaming events",
    icon: Calendar,
    rarity: "Bronze",
    earnedDate: "2 weeks ago",
    points: 200,
    category: "Events",
  },
  {
    id: 4,
    title: "First Steps",
    description: "Complete your profile setup",
    icon: Star,
    rarity: "Bronze",
    earnedDate: "1 month ago",
    points: 100,
    category: "Getting Started",
  },
]

const availableTrophies = [
  {
    id: 5,
    title: "Game Master",
    description: "Own 500+ games in your collection",
    icon: Crown,
    rarity: "Platinum",
    progress: 50,
    maxProgress: 100,
    points: 1000,
    category: "Collection",
  },
  {
    id: 6,
    title: "Community Leader",
    description: "Connect with 100+ fellow gamers",
    icon: Shield,
    rarity: "Gold",
    progress: 38,
    maxProgress: 100,
    points: 750,
    category: "Social",
  },
  {
    id: 7,
    title: "Tournament Champion",
    description: "Win 5 competitive tournaments",
    icon: Trophy,
    rarity: "Gold",
    progress: 2,
    maxProgress: 5,
    points: 600,
    category: "Competition",
  },
  {
    id: 8,
    title: "Streak Master",
    description: "Play games for 30 consecutive days",
    icon: Zap,
    rarity: "Silver",
    progress: 12,
    maxProgress: 30,
    points: 400,
    category: "Activity",
  },
]

const rarityColors = {
  Bronze: "text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  Silver: "text-gray-500 bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
  Gold: "text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  Platinum: "text-purple-600 bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
}

const categoryColors = {
  Collection: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  Social: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  Events: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  Competition: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  Activity: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "Getting Started": "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
}

export default function TrophiesPage() {
  const totalPoints = earnedTrophies.reduce((sum, trophy) => sum + trophy.points, 0)
  const totalTrophies = earnedTrophies.length
  const completionRate = Math.round((earnedTrophies.length / (earnedTrophies.length + availableTrophies.length)) * 100)

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Trophy Collection</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Showcase your gaming achievements and unlock prestigious honors
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card className="room-furniture text-center">
            <CardContent className="p-6">
              <Trophy className="h-12 w-12 text-accent-gold mx-auto mb-4" />
              <div className="text-3xl font-bold text-accent-gold font-heading mb-2">{totalTrophies}</div>
              <div className="text-sm text-muted-foreground font-body">Trophies Earned</div>
            </CardContent>
          </Card>

          <Card className="room-furniture text-center">
            <CardContent className="p-6">
              <Star className="h-12 w-12 text-accent-gold mx-auto mb-4" />
              <div className="text-3xl font-bold text-accent-gold font-heading mb-2">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground font-body">Trophy Points</div>
            </CardContent>
          </Card>

          <Card className="room-furniture text-center">
            <CardContent className="p-6">
              <Target className="h-12 w-12 text-accent-gold mx-auto mb-4" />
              <div className="text-3xl font-bold text-accent-gold font-heading mb-2">{completionRate}%</div>
              <div className="text-sm text-muted-foreground font-body">Completion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Earned Trophies */}
        <div className="mb-12">
          <h2 className="ornate-text font-heading text-3xl font-bold mb-8 text-center">Earned Trophies</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {earnedTrophies.map((trophy) => (
              <Card key={trophy.id} className="room-furniture hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-accent-gold/20">
                      <trophy.icon className="h-8 w-8 text-accent-gold" />
                    </div>
                  </div>
                  <CardTitle className="font-heading text-lg">{trophy.title}</CardTitle>
                  <div className="flex justify-center space-x-2 mt-2">
                    <Badge className={rarityColors[trophy.rarity as keyof typeof rarityColors]}>{trophy.rarity}</Badge>
                    <Badge variant="outline" className={categoryColors[trophy.category as keyof typeof categoryColors]}>
                      {trophy.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="font-body text-sm text-muted-foreground mb-4">{trophy.description}</p>
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-accent-gold font-heading">+{trophy.points} points</div>
                    <div className="text-xs text-muted-foreground font-body">Earned {trophy.earnedDate}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Available Trophies */}
        <div>
          <h2 className="ornate-text font-heading text-3xl font-bold mb-8 text-center">Available Trophies</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availableTrophies.map((trophy) => (
              <Card key={trophy.id} className="room-furniture hover:shadow-lg transition-shadow opacity-80">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-muted">
                      <trophy.icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <CardTitle className="font-heading text-lg">{trophy.title}</CardTitle>
                  <div className="flex justify-center space-x-2 mt-2">
                    <Badge variant="outline" className={rarityColors[trophy.rarity as keyof typeof rarityColors]}>
                      {trophy.rarity}
                    </Badge>
                    <Badge variant="outline" className={categoryColors[trophy.category as keyof typeof categoryColors]}>
                      {trophy.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="font-body text-sm text-muted-foreground mb-4">{trophy.description}</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-body">
                        <span>Progress</span>
                        <span>
                          {trophy.progress}/{trophy.maxProgress}
                        </span>
                      </div>
                      <Progress value={(trophy.progress / trophy.maxProgress) * 100} className="h-2" />
                    </div>
                    <div className="text-lg font-bold text-muted-foreground font-heading">+{trophy.points} points</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="room-furniture max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Award className="h-16 w-16 text-accent-gold mx-auto mb-6" />
              <h3 className="ornate-text font-heading text-2xl font-bold mb-4">Keep Collecting!</h3>
              <p className="font-body text-muted-foreground mb-6">
                Complete challenges, reach milestones, and unlock exclusive trophies that showcase your gaming journey.
                Every achievement brings you closer to legendary status!
              </p>
              <Button size="lg" className="theme-accent-gold">
                View All Challenges
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
