import { useEffect } from 'react';

import { Plus, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { useItemForm } from '@/hooks/useItemForm';
import { type CombinedItem, type Category, type Status } from '@/types/types';

type ItemFormProps = {
    // Determine mode by checking if 'item' prop exists
    item?: CombinedItem;
    category?: Category;
    onSuccess: (newStatus: Status) => void;
    activeListStatus: Status;
};

export function ItemForm({
    item,
    category,
    onSuccess,
    activeListStatus,
}: ItemFormProps) {
    const mode = item ? 'edit' : 'add';
    const {
        isOpen,
        setIsOpen,
        isLoading,
        formData,
        handleFieldChange,
        handleSubmit,
        FieldsComponent,
        effectiveCategory,
    } = useItemForm({
        mode,
        item,
        category,
        onSuccess,
    });

    useEffect(() => {
        if (mode === 'add' && isOpen && activeListStatus) {
            handleFieldChange('status', activeListStatus);
        }
    }, [isOpen, activeListStatus, mode, handleFieldChange]);

    const capitalizedCategory =
        effectiveCategory.charAt(0).toUpperCase() + effectiveCategory.slice(1);
    const addModeStatusText =
        formData.status === 'ranked' ? 'Review' : 'to Backlog';
    const dialogTitle =
        mode === 'add'
            ? `Add New ${capitalizedCategory} ${addModeStatusText}`
            : `Edit ${item?.name}`;
    const statusText = formData.status === 'ranked' ? 'Review' : 'Notes';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {mode === 'add' ? (
                    <Button size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-5 w-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="overflow-hidden">
                    <DialogTitle className="break-words">
                        {dialogTitle}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'add' ? (
                            <span>
                                Fields marked with
                                <span className="text-destructive"> * </span>
                                are required.
                            </span>
                        ) : (
                            `Make changes to your item below.`
                        )}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Common Fields */}

                    {/* Status Toggle */}
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={formData.status}
                        onValueChange={(value: Status) => {
                            if (value) handleFieldChange('status', value);
                        }}
                        className="w-full"
                    >
                        <ToggleGroupItem value="ranked" className="flex-1">
                            Ranked
                        </ToggleGroupItem>
                        <ToggleGroupItem value="backlog" className="flex-1">
                            Backlog
                        </ToggleGroupItem>
                    </ToggleGroup>

                    <Separator />

                    {/* Name Field */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                handleFieldChange('name', e.target.value)
                            }
                            className="col-span-3 break-words"
                            autoComplete="off"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label
                            htmlFor="description"
                            className="text-right pt-2"
                        >
                            {statusText}
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                handleFieldChange('description', e.target.value)
                            }
                            className="col-span-3"
                        />
                    </div>
                    <Separator />

                    {/* Category Specific Fields */}
                    <FieldsComponent
                        formData={formData}
                        onFieldChange={handleFieldChange}
                    />

                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? 'Saving...'
                            : mode === 'add'
                              ? 'Add Item'
                              : 'Save Changes'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
