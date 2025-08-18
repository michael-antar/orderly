import { cn, getCategoryDetails } from '@/lib/utils';

import { Card } from '@/components/ui/card';
import { TagBadge } from './TagBadge';

import { type CombinedItem } from '@/types/types';

type ItemCardProps = {
    item: CombinedItem;
    onSelect: () => void;
    isSelected: boolean;
};

export const ItemCard = ({ item, onSelect, isSelected }: ItemCardProps) => {
    const { name, status, rating, tags } = item;
    const detailsString = getCategoryDetails(item)
        .map((detail) => detail[1])
        .join(', ');

    return (
        <Card
            className={cn(
                'mb-4 p-4 cursor-default',
                isSelected ? 'bg-muted' : 'hover:bg-muted/50',
            )}
            onClick={onSelect}
        >
            <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                    <div className="flex items-baseline">
                        <h3 className="text-xl font-semibold truncate leading-tight">
                            {name}
                        </h3>
                        {status === 'ranked' && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground leading-tight">
                                {rating}
                            </span>
                        )}
                    </div>
                    {detailsString && (
                        <p className="text-sm text-muted-foreground truncate">
                            {detailsString}
                        </p>
                    )}
                </div>
                {/* Display Tags */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <TagBadge key={tag.id} name={tag.name} />
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};
