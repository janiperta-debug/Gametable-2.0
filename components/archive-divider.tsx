import type React from "react"
import { cn } from "@/lib/utils"

export interface ArchiveDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "subtle" | "ornate" | "inset"
}

export function ArchiveDivider({ className, variant = "subtle", ...props }: ArchiveDividerProps) {
  return (
    <div className={cn("flex w-full items-center gap-3", variant === "inset" && "px-2", className)} {...props}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--archive-metal-dark,#9a7320)] to-[var(--archive-metal-mid,#c9a14a)]" />
      <span
        aria-hidden="true"
        className={cn(
          "relative block rotate-45 border border-[var(--archive-metal-mid,#c9a14a)] bg-[var(--archive-wood-base,#2b190c)]",
          variant === "ornate" ? "h-2.5 w-2.5 shadow-[0_0_0_1px_rgba(217,182,92,0.25)]" : "h-1.5 w-1.5",
        )}
      />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--archive-metal-dark,#9a7320)] to-[var(--archive-metal-mid,#c9a14a)]" />
    </div>
  )
}
