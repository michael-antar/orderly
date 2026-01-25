import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Trash2 } from 'lucide-react';
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
import { Button } from './ui/button';
import { ItemDetailsContent } from './ItemDetailsContent';
import { ItemForm } from './ItemForm';

import type { CategoryDefinition, Item, Status } from '@/types/types';

type ItemDetailViewProps = {
    item: Item | null;
    categoryDef: CategoryDefinition | null;
    activeListStatus?: Status;
    onClose: () => void;
    onEdit: (newStatus: Status, updatedItem: Item) => void;
    onDelete: () => void;
};

export const ItemDetailView = ({
    item,
    categoryDef,
    onClose,
    onEdit,
    onDelete,
}: ItemDetailViewProps) => {
    const handleDelete = async () => {
        if (!item) return;

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            toast.success('Item deleted.');
            onDelete(); // Trigger a refresh in the parent component
        } catch (error: any) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item', {
                description: error.message,
            });
        }
    };

    if (!item || !categoryDef) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">
                    Select an item to see details
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col m-4 pt-4 lg:pt-0">
            {/* Button Row */}
            <div className="flex gap-2 justify-between lg:justify-end">
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={onClose}
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to list</span>
                </Button>

                {/* Button Row Right Side */}
                <div className="flex gap-2">
                    {/* Edit Item Form */}
                    <ItemForm
                        item={item}
                        categoryDef={categoryDef}
                        mode="edit"
                        onSuccess={(newStatus, newItem) =>
                            onEdit(newStatus, newItem)
                        }
                    />

                    {/* Delete Button and Confirmation Dialog */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-5 w-5" />
                                <span className="sr-only">Delete item</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader className="overflow-hidden">
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="break-words">
                                    This action cannot be undone. This will
                                    permanently delete the item
                                    <span className="font-semibold">
                                        {' '}
                                        {item.name}
                                    </span>{' '}
                                    and all of its data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <ItemDetailsContent item={item} categoryDef={categoryDef} />
        </div>
    );
};
