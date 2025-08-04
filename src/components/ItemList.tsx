import { type CombinedItem } from "@/types/types";
import { ItemCard } from "./ItemCard";

type ItemListProps = {
    items: CombinedItem[];
    loading: boolean;
    selectedItem: CombinedItem | null;
    onSelectItem: (item: CombinedItem) => void;
    emptyMessage: string;
};

export const ItemList = ({ items, loading, selectedItem, onSelectItem, emptyMessage }: ItemListProps) => {
    if (loading) {
        return <p className="text-muted-foreground">Loading items...</p>;
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