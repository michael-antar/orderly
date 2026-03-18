import { memo, useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { cn, getCategoryDetails } from '@/lib/utils';
import type { FieldDefinition, Item } from '@/types/types';

import { TagBadge } from '../categories/TagBadge';

/** Three-dot confidence indicator derived from the Glicko-1 RD value. */
const RDConfidence = ({ rd }: { rd: number }) => {
  // 3 dots = high confidence (rd < 150), 2 = medium, 1 = low
  const filled = rd < 150 ? 3 : rd < 250 ? 2 : 1;
  return (
    <div className="flex gap-0.5 items-center" title={`Rating confidence (RD: ${Math.round(rd)})`}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn('w-1 h-1 rounded-full', i < filled ? 'bg-primary/70' : 'bg-muted-foreground/20')} />
      ))}
    </div>
  );
};

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
      className={cn(
        'mb-4 p-4 cursor-default transition-all duration-200',
        isSelected ? 'bg-muted' : 'hover:bg-muted/50 hover:shadow-sm hover:-translate-y-px',
        podiumClass,
      )}
      onClick={() => onSelect(item)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <h3 className="text-xl font-semibold truncate leading-tight">{name}</h3>
            {status === 'ranked' && (
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <span className="text-sm font-normal text-muted-foreground leading-tight tabular-nums">{rating}</span>
                <RDConfidence rd={item.rd} />
              </div>
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
