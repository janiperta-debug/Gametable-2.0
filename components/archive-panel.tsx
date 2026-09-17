import type React from "react"
import { cn } from "@/lib/utils"
import { ArchiveFrame } from "./archive-frame"

export interface ArchivePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use a quieter surface for forms, lists, and supporting content. */
  inset?: boolean
}

export function ArchivePanel({ className, children, inset = false, ...props }: ArchivePanelProps) {
  return (
    <ArchiveFrame
      weight="thin"
      corners={false}
      centerOrnaments={false}
      className={cn("rounded-lg", className)}
    >
      <div
        className={cn(
          "relative rounded-[0.4rem] text-foreground",
          inset ? "bg-black/35 shadow-[inset_0_1px_8px_rgba(0,0,0,0.45)]" : "bg-black/20",
        )}
        {...props}
      >
        {children}
      </div>
    </ArchiveFrame>
  )
}
