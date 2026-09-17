import type React from "react"
import { cn } from "@/lib/utils"
import { ArchiveFrame } from "./archive-frame"

export interface ArchiveAvatarFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const sizes = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-24 w-24",
}

/** A round avatar frame with restrained ornaments matching the Archive family. */
export function ArchiveAvatarFrame({ className, children, size = "md", ...props }: ArchiveAvatarFrameProps) {
  return (
    <div className={cn("relative inline-flex shrink-0", sizes[size], className)} {...props}>
      <ArchiveFrame round weight="thin" corners={false} centerOrnaments={false} className="h-full w-full rounded-full">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
          {children}
        </div>
      </ArchiveFrame>
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-2px] h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--archive-metal-highlight,#f4e3a8)] shadow-[0_0_0_1px_rgba(60,35,8,0.8)]" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[-2px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--archive-metal-highlight,#f4e3a8)] shadow-[0_0_0_1px_rgba(60,35,8,0.8)]" />
      <span aria-hidden="true" className="pointer-events-none absolute left-[-1px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[var(--archive-metal-mid,#c9a14a)]" />
      <span aria-hidden="true" className="pointer-events-none absolute right-[-1px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[var(--archive-metal-mid,#c9a14a)]" />
    </div>
  )
}
