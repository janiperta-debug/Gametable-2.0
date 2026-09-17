import type React from "react"
import { cn } from "@/lib/utils"

export function ArchiveHeading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("archive-heading", className)} {...props} />
}

export function ArchiveBody({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("archive-body", className)} {...props} />
}

export function ArchiveLabel({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("archive-label", className)} {...props} />
}

export function ArchiveText({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("archive-text", className)} {...props} />
}
