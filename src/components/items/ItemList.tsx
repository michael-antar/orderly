import { ListChecks, Package } from 'lucide-react';

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
 * On initial load (empty list), full skeletons are shown. On re-fetches (list
 * already populated), existing items are dimmed with pointer events disabled
 * to avoid a jarring full-skeleton flash.
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
  // Initial load — no items yet, show skeletons
  if (loading && items.length === 0) {
    return (
      <div className="ml-10">
        {Array.from({ length: 5 }).map((_, index) => (
          <ItemCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    const Icon = showPodium !== undefined ? ListChecks : Package;
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center py-16 px-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className={loading ? 'opacity-50 pointer-events-none' : undefined}>
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
