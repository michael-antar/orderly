import { type CombinedItem } from '@/types/types';
import { ItemCard } from './ItemCard';
import { ItemCardSkeleton } from './ItemCardSkeleton';

type ItemListProps = {
    items: CombinedItem[];
    loading: boolean;
    selectedItem: CombinedItem | null;
    onSelectItem: (item: CombinedItem) => void;
    emptyMessage: string;
};

export const ItemList = ({
    items,
    loading,
    selectedItem,
    onSelectItem,
    emptyMessage,
}: ItemListProps) => {
    // Use skeleton if loading
    if (loading) {
        const skeletonCount = items.length > 0 ? items.length : 5;
        return (
            <div>
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <ItemCardSkeleton key={index} />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return <p className="text-muted-foreground">{emptyMessage}</p>;
    }

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {items.map((item) => (
                <ItemCard
                    key={item.id}
                    item={item}
                    onSelect={() => onSelectItem(item)}
                    isSelected={selectedItem?.id === item.id}
                />
            ))}
        </div>
    );
};
