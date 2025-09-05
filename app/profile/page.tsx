import { ProfileHeader } from "@/components/profile-header"
import { ProfileStats } from "@/components/profile-stats"
import { RecentActivity } from "@/components/profile-recent-activity"
import { CollectionHighlights } from "@/components/collection-highlights"
import { QuickActions } from "@/components/quick-actions"
import { UpcomingEvents } from "@/components/profile-upcoming-events"
import { TrophyShowcase } from "@/components/trophy-showcase"
import { FriendActivity } from "@/components/friend-activity"

export default function ProfilePage() {
  return (
    <div className="min-h-screen main-hall-bg-pattern">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <ProfileHeader />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Gaming Progress Stats */}
            <ProfileStats />

            {/* Recent Activity */}
            <RecentActivity />

            {/* Collection Highlights */}
            <CollectionHighlights />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <QuickActions />

            {/* Upcoming Events */}
            <UpcomingEvents />

            {/* Trophy Showcase */}
            <TrophyShowcase />

            {/* Friend Activity */}
            <FriendActivity />
          </div>
        </div>
      </div>
    </div>
  )
}
