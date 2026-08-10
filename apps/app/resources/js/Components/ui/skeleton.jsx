import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("ui-skeleton rounded-inner", className)}
      {...props}
    />
  )
}

export { Skeleton }
