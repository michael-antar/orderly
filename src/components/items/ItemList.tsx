import type { FieldDefinition, Item } from '@/types/types';

import { ItemCard } from './ItemCard';
import { ItemCardSkeleton } from './ItemCardSkeleton';

const PODIUM_STYLES: Record<number, string> = {
  0: 'border-yellow-500', // Gold
  1: 'border-slate-500', // Silver
  2: 'border-orange-500', // Bronze
};

export interface ItemListProps {
  items: Item[];
  fieldDefinitions: FieldDefinition[];
  loading: boolean;
  selectedItem: Item | null;
  onSelectItem: (item: Item) => void;
  emptyMessage: string;
  showPodium?: boolean;
}

/**
 * Renders a list of item cards with loading skeletons and podium highlighting.
 */
export const ItemList = ({
  items,
  fieldDefinitions,
  loading,
  selectedItem,
  onSelectItem,
  emptyMessage,
  showPodium = false,
}: ItemListProps) => {
  // Use skeleton if loading
  if (loading) {
    const skeletonCount = items.length > 0 ? items.length : 5;
    return (
      <div className="ml-10">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ItemCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex justify-center mt-5">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {items.map((item, index) => {
        const podiumClass = showPodium ? (PODIUM_STYLES[index] ?? '') : '';

        return (
          <div key={item.id} className="flex items-center gap-4">
            {/* Index Number */}
            <span className="w-8 text-center text-lg font-semibold text-muted-foreground">{index + 1}</span>

            {/* Item Card */}
            <div className="flex-1 min-w-0">
              <ItemCard
                item={item}
                fieldDefinitions={fieldDefinitions}
                onSelect={onSelectItem}
                isSelected={selectedItem?.id === item.id}
                podiumClass={podiumClass}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
