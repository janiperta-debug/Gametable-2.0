import { 
  getUserByUsername, 
  getUserCollectionByUsername, 
  getUserFriends,
} from "@/app/actions/users"
import { UserProfileClient } from "./user-profile-client"

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  
  // Fetch data server-side where cookies/auth work properly
  const [profileResult, collectionResult, friendsResult] = await Promise.all([
    getUserByUsername(username),
    getUserCollectionByUsername(username),
    getUserFriends(username)
  ])

  return (
    <UserProfileClient 
      initialProfile={profileResult.profile}
      initialCollection={collectionResult.games || []}
      initialFriends={friendsResult.friends || []}
      username={username}
    />
  )
}
