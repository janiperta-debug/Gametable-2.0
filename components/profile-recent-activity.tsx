import { ArchiveFrame } from "@/components/archive-frame"
import { ArchiveButton } from "@/components/archive-button"
import { ExternalLink } from "lucide-react"

const activities: any[] = []

export function RecentActivity() {
  return (
    <ArchiveFrame className="w-full" weight="regular">
      <section className="p-5 sm:p-6" aria-labelledby="recent-activity-title">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-activity-title" className="archive-heading text-2xl font-bold">
            Recent Activity
          </h2>
          <ArchiveButton type="button" onClick={() => undefined}>
            <span className="archive-body">View All</span>
            <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
          </ArchiveButton>
        </header>

        <div className="mt-5 space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="archive-content flex items-start gap-4 rounded-lg border border-[var(--archive-gold)]/40 bg-black/20 p-4 transition-colors"
            >
              <div className={`flex-shrink-0 rounded-full p-2 ${activity.color}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="archive-body text-sm font-medium">{activity.title}</p>
                    <p className="archive-body text-sm opacity-80">{activity.description}</p>
                  </div>
                  <ArchiveButton type="button" className="text-xs">
                    <span className="archive-body">{activity.action}</span>
                  </ArchiveButton>
                </div>
                <p className="archive-label text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </ArchiveFrame>
  )
}
