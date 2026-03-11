import { memo, useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { cn, getCategoryDetails } from '@/lib/utils';
import type { FieldDefinition, Item } from '@/types/types';

import { TagBadge } from '../categories/TagBadge';

export interface ItemCardProps {
  item: Item;
  fieldDefinitions: FieldDefinition[];
  onSelect: (item: Item) => void;
  isSelected: boolean;
  podiumClass?: string;
}

/**
 * Renders an individual item within a list or grid.
 * Wrapped in React.memo to prevent unnecessary re-renders when sibling cards are selected/unselected.
 */
export const ItemCard = memo(({ item, fieldDefinitions, onSelect, isSelected, podiumClass }: ItemCardProps) => {
  const { name, status, rating, tags } = item;

  const detailsString = useMemo(() => {
    return getCategoryDetails(item, fieldDefinitions)
      .map((detail) => detail[1])
      .join(', ');
  }, [item, fieldDefinitions]);

  return (
    <Card
      className={cn('mb-4 p-4 cursor-default', isSelected ? 'bg-muted' : 'hover:bg-muted/50', podiumClass)}
      onClick={() => onSelect(item)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <h3 className="text-xl font-semibold truncate leading-tight">{name}</h3>
            {status === 'ranked' && (
              <span className="ml-2 text-sm font-normal text-muted-foreground leading-tight">{rating}</span>
            )}
          </div>
          {detailsString && <p className="text-sm text-muted-foreground truncate">{detailsString}</p>}
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
});

ItemCard.displayName = 'ItemCard';
