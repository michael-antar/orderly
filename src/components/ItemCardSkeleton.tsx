import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ItemCardSkeleton = () => {
    return (
        <Card className="mb-4 p-4">
            <div className="flex flex-col">
                <div className="flex items-baseline">
                    {/* Skeleton for the title */}
                    <Skeleton className="h-6 w-1/2" />
                    {/* Skeleton for the rating */}
                    <Skeleton className="ml-2 h-5 w-12" />
                </div>
                {/* Skeleton for the details line */}
                <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
        </Card>
    );
};
