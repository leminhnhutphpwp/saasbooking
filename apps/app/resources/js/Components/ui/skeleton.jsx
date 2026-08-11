import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn("ui-skeleton rounded-inner", className)}
            {...props}
        />
    )
}

function SkeletonCard({ className, ...props }) {
    return (
        <div className={cn("space-y-3 rounded-card bg-surface p-6 shadow-card", className)} {...props}>
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
        </div>
    )
}

function SkeletonTable({ rows = 5, className, ...props }) {
    return (
        <div className={cn("space-y-2 rounded-card bg-surface p-4 shadow-card", className)} {...props}>
            <div className="flex gap-4 border-b pb-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/6" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/6" />
                </div>
            ))}
        </div>
    )
}

function SkeletonList({ rows = 4, className, ...props }) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-inner bg-sunk p-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/5" />
                        <Skeleton className="h-3 w-3/5" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonList }
