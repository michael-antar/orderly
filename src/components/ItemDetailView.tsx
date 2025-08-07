import { type CombinedItem } from "@/types/types";
import { getCategoryDetails } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { ArrowLeft, Trash2 } from "lucide-react";

type ItemDetailViewProps = {
  item: CombinedItem | null;
  onClose: () => void;
  onDelete: () => void;
};

export const ItemDetailView = ({ item, onClose, onDelete }: ItemDetailViewProps) => {

  const handleDelete = async () => {
    if (!item) return;

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', item.id);

    if (error) {
      toast.error("Delete failed", { description: "There was a problem deleting your item." });
      console.error("Error deleting item:", error);
    } else {
      toast.success("Item deleted", { description: `'${item.name}' has been removed.` });
      onDelete(); // Trigger a refresh in the parent component
    }
  };

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select an item to see details</p>
      </div>
    );
  }

  const details = getCategoryDetails(item);

  return (
    <div className="relative h-full px-4 overflow-y-auto">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 md:hidden"
        onClick={onClose}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back to list</span>
      </Button>

      {/* Delete Button and Confirmation Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Delete item</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              <span className="font-semibold"> {item.name}</span> and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <h2 className="text-3xl font-bold pt-12 truncate">{item.name}</h2>
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