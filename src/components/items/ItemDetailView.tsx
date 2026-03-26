import { ArrowLeft, MousePointerClick, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import type { CategoryDefinition, Item, Status } from '@/types/types';

import { ItemDetailsContent } from './ItemDetailsContent';
import { ItemForm } from './ItemForm';

export interface ItemDetailViewProps {
  /** If null, empty placeholder is shown instead */
  item: Item | null;
  categoryDef: CategoryDefinition | null;
  onClose: () => void;
  onEdit: (newStatus: Status, updatedItem: Item) => void;
  onDelete: () => void;
}

/**
 * Interactive detail panel for a specific item.
 * Controls the read-only display, the edit flow, and the deletion lifecycle.
 *
 * Side Effects:
 * - Mutates the Supabase `items` table upon confirmed deletion.
 */
export const ItemDetailView = ({ item, categoryDef, onClose, onEdit, onDelete }: ItemDetailViewProps) => {
  if (!item || !categoryDef) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
        <MousePointerClick className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Select an item to see its details</p>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('items').delete().eq('id', item.id);

      if (error) throw error;

      toast.success('Item deleted.');
      onDelete(); // Trigger a refresh in the parent component
    } catch (error: unknown) {
      console.error('Error deleting item:', error);

      const description = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error('Failed to delete item', {
        description,
      });
    }
  };

  return (
    <div className="flex flex-col m-3 sm:m-4 pt-3 sm:pt-4 lg:pt-0">
      {/* Button Row */}
      <div className="flex gap-2 justify-between lg:justify-end">
        {/* Close Button (Mobile Only) */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to list</span>
        </Button>

        {/* Button Row Right Side */}
        <div className="flex">
          {/* Edit Item Form */}
          <ItemForm item={item} categoryDef={categoryDef} mode="edit" onSuccess={onEdit} />

          {/* Delete Button and Confirmation Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Delete item</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader className="overflow-hidden">
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="break-words">
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
        </div>
      </div>

      <ItemDetailsContent item={item} categoryDef={categoryDef} />
    </div>
  );
};
