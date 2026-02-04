import type { Game } from "./types"

// Mock data for development
const mockGames: Game[] = [
  {
    id: "1",
    name: "Gloomhaven",
    category: "board-game",
    bggId: "174430",
    bggRating: 8.7,
    yearPublished: 2017,
    thumbnail: "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/veqFeP4d_3zNOkvMhUmSk4ZQYv4=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg",
    image: "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/l1XmR74mjGyP0cN0PEJd1Qzevsk=/0x0/filters:format(jpeg)/pic2437871.jpg",
    minPlayers: 1,
    maxPlayers: 4,
    playingTime: 120,
    addedAt: new Date("2024-01-15"),
    userId: "mock-user",
  },
  {
    id: "2", 
    name: "Warhammer 40,000",
    category: "miniature",
    bggId: "2165",
    bggRating: 7.5,
    yearPublished: 1987,
    thumbnail: "https://cf.geekdo-images.com/C__3PWZFCwO6Eqvq3SUzTQ__thumb/img/oBDGnXuFPmkx6lBgMXI_fLQxZkM=/fit-in/200x150/filters:strip_icc()/pic3747444.png",
    image: "https://cf.geekdo-images.com/C__3PWZFCwO6Eqvq3SUzTQ__original/img/M-qx_O2sXvtFVCLfTbcpJCM1_bI=/0x0/filters:format(png)/pic3747444.png",
    minPlayers: 2,
    maxPlayers: 2,
    playingTime: 180,
    addedAt: new Date("2024-02-20"),
    userId: "mock-user",
  },
  {
    id: "3",
    name: "Dungeons & Dragons",
    category: "rpg",
    bggId: "26424",
    bggRating: 8.0,
    yearPublished: 2014,
    thumbnail: "https://cf.geekdo-images.com/no_IudEq0p7q3jgGUs1WIA__thumb/img/PVPVcpO_I52xSNs9T-4ZoNqDhHA=/fit-in/200x150/filters:strip_icc()/pic2155934.jpg",
    image: "https://cf.geekdo-images.com/no_IudEq0p7q3jgGUs1WIA__original/img/BnEVfBfMrLLQTOIBFFSa3WqNO-k=/0x0/filters:format(jpeg)/pic2155934.jpg",
    minPlayers: 3,
    maxPlayers: 6,
    playingTime: 240,
    addedAt: new Date("2024-03-10"),
    userId: "mock-user",
  },
]

export class GameService {
  // Get user's games - returns mock data for development
  static async getUserGames(userId?: string): Promise<Game[]> {
    console.log("[v0] GameService.getUserGames called (mock)", userId)
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))
    return [...mockGames]
  }

  // Get games by category
  static async getGamesByCategory(category: Game["category"], userId?: string): Promise<Game[]> {
    console.log("[v0] GameService.getGamesByCategory called (mock)", category)
    await new Promise((resolve) => setTimeout(resolve, 100))
    return mockGames.filter((game) => game.category === category)
  }

  // Add a new game - returns mock ID
  static async addGame(gameData: Omit<Game, "id" | "addedAt" | "userId">): Promise<string | null> {
    console.log("[v0] GameService.addGame called (mock)", gameData.name)
    await new Promise((resolve) => setTimeout(resolve, 100))
    const newId = `mock-${Date.now()}`
    mockGames.push({
      ...gameData,
      id: newId,
      addedAt: new Date(),
      userId: "mock-user",
    })
    return newId
  }

  // Update a game
  static async updateGame(gameId: string, updates: Partial<Game>): Promise<boolean> {
    console.log("[v0] GameService.updateGame called (mock)", gameId)
    await new Promise((resolve) => setTimeout(resolve, 100))
    const index = mockGames.findIndex((g) => g.id === gameId)
    if (index !== -1) {
      mockGames[index] = { ...mockGames[index], ...updates }
      return true
    }
    return false
  }

  // Delete a game
  static async deleteGame(gameId: string): Promise<boolean> {
    console.log("[v0] GameService.deleteGame called (mock)", gameId)
    await new Promise((resolve) => setTimeout(resolve, 100))
    const index = mockGames.findIndex((g) => g.id === gameId)
    if (index !== -1) {
      mockGames.splice(index, 1)
      return true
    }
    return false
  }
}
