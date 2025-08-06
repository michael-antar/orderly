import { type CombinedItem } from "@/types/types";
import { getCategoryDetails } from "@/lib/utils";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

type ItemDetailViewProps = {
  item: CombinedItem | null;
  onClose: () => void;
};

export const ItemDetailView = ({ item, onClose }: ItemDetailViewProps) => {

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select an item to see details</p>
      </div>
    );
  }

  const details = getCategoryDetails(item);

  return (
    <div className="p-4 pt-0">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 md:hidden"
        onClick={onClose}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back to list</span>
      </Button>
      <h2 className="text-3xl font-bold pt-12 truncate md:pt-0">{item.name}</h2>
      <p className="text-muted-foreground capitalize">
        {item.status === 'ranked' ? `Elo: ${item.rating}` : 'Backlog'}
      </p>

      {item.description && (
        <p className="mt-4 text-sm whitespace-pre-wrap break-words">{item.description}</p>
      )}

      <div className="mt-6 space-y-2 border-t pt-4">
        {details.map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
                <span className="font-semibold text-muted-foreground">{key}</span>
                <span className="text-foreground text-right truncate">{value}</span>
            </div>
        ))}
      </div>
    </div>
  );
};