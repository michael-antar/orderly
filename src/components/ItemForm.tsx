import { memo } from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { DynamicFieldRenderer } from '@/components/DynamicFieldRenderer';
import { TagInput } from '@/components/TagInput';

import { useItemForm } from '@/hooks/useItemForm';
import type { Item, CategoryDefintion, Status } from '@/types/types';

type ItemFormProps = {
    // Determine mode by checking if 'item' prop exists
    item?: Item;
    categoryDef: CategoryDefintion;
    mode: 'add' | 'edit';
    trigger?: React.ReactNode;
    onSuccess: (newStatus: Status, newItem: Item) => void;
};

export const ItemForm = memo(function ItemForm({
    item,
    categoryDef,
    mode,
    trigger,
    onSuccess,
}: ItemFormProps) {
    const {
        isOpen,
        setIsOpen,
        isLoading,
        formData,
        handleMainFieldChange,
        handlePropertyChange,
        handleSubmit,
        availableTags,
    } = useItemForm({
        mode,
        categoryDef,
        item,
        onSuccess,
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add {categoryDef.name}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add'
                            ? `Add New ${categoryDef.name}`
                            : `Edit ${categoryDef.name}`}
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

                <form
                    // id="item-form"
                    onSubmit={handleSubmit}
                    className="space-y-6 py-4"
                >
                    <div className="grid gap-4 py-4">
                        {/* Status Toggle */}
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={formData.status}
                            onValueChange={(value: Status) => {
                                if (value)
                                    handleMainFieldChange('status', value);
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

                        {/* Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    handleMainFieldChange(
                                        'name',
                                        e.target.value,
                                    )
                                }
                                className="col-span-3 break-words"
                                autoComplete="off"
                                required
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <TagInput
                                selectedTags={formData.tags || []}
                                availableTags={availableTags}
                                onTagsChange={(tags) =>
                                    handleMainFieldChange('tags', tags)
                                }
                            />
                        </div>

                        <Separator />

                        {/* Description */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label
                                htmlFor="description"
                                className="text-right pt-2"
                            >
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                className="col-span-3 max-h-40"
                                placeholder="Optional notes..."
                                value={formData.description}
                                onChange={(e) =>
                                    handleMainFieldChange(
                                        'description',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>

                        <Separator />

                        {/* Dynamic Fields */}
                        <div className="space-y-4 rounded-md bg-muted/30 p-4">
                            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                                {categoryDef.name} Details
                            </h4>

                            {categoryDef.field_definitions.map((field) => (
                                <DynamicFieldRenderer
                                    key={field.key}
                                    field={field}
                                    value={formData.properties[field.key]}
                                    onChange={(val) =>
                                        handlePropertyChange(field.key, val)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </form>

                <DialogFooter className="flex-shrink-0">
                    {/* Submit Button */}
                    <Button type="submit" form="item-form" disabled={isLoading}>
                        {isLoading
                            ? 'Saving...'
                            : mode === 'add'
                              ? 'Add Item'
                              : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});
