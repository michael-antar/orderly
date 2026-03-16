import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for ItemCard component
 */
export const ItemCardSkeleton = () => {
  return (
    <Card className="mb-4 p-4 animate-shimmer">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            {/* Title Skeleton */}
            <Skeleton className="h-6 w-1/2" />
            {/* Rating Skeleton */}
            <Skeleton className="ml-2 h-5 w-12" />
          </div>
          {/* Details Skeleton */}
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>

        {/* Tags Skeletons */}
        <div className="flex flex-wrap gap-2 mt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </Card>
  );
};
