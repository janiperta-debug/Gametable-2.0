import type React from "react"
import { cn } from "@/lib/utils"
import { ArchiveFrame } from "./archive-frame"

export interface ArchiveTileProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
}

export function ArchiveTile({ className, children, active = false, ...props }: ArchiveTileProps) {
  return (
    <ArchiveFrame
      weight="hairline"
      corners={false}
      centerOrnaments={false}
      className={cn("rounded-md transition-colors", active && "brightness-125", className)}
    >
      <div className="rounded-[0.3rem] bg-black/25 text-foreground" {...props}>
        {children}
      </div>
    </ArchiveFrame>
  )
}
