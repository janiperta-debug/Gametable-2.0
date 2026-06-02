import { MyGamesHeader } from "@/components/my-games-header"
import { GameCategoryTabs } from "@/components/game-category-tabs"

export default function MyGamesPage() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <MyGamesHeader />
        <GameCategoryTabs />
      </main>
    </div>
  )
}
