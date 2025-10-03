import { ProfileHeader } from "@/components/profile-header"
import { GamingProgress } from "@/components/gaming-progress"
import { ProfileNotifications } from "@/components/profile-notifications"
import { GameInterests } from "@/components/game-interests"
import { ManorCorrespondence } from "@/components/manor-correspondence"
import { PrivacyControls } from "@/components/privacy-controls"
import { FriendsList } from "@/components/friends-list"
import { AccountManagement } from "@/components/account-management"

export default function ProfilePage() {
  return (
    <div className="min-h-screen page-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <ProfileHeader />

        {/* Profile Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          <GamingProgress />

          {/* My Notifications */}
          <ProfileNotifications />

          {/* Game Interests */}
          <GameInterests />

          {/* Manor Correspondence */}
          <ManorCorrespondence />

          {/* Privacy Controls */}
          <PrivacyControls />

          {/* Friends */}
          <FriendsList />

          {/* Account Management */}
          <AccountManagement />
        </div>
      </div>
    </div>
  )
}
