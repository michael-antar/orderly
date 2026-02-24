import { memo } from 'react';

import { Plus, Pencil } from 'lucide-react';

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
import type { Item, CategoryDefinition, Status } from '@/types/types';

type ItemFormProps = {
    // Determine mode by checking if 'item' prop exists
    item?: Item;
    categoryDef: CategoryDefinition;
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
        existingTags,
    } = useItemForm({
        mode,
        categoryDef,
        item,
        onSuccess,
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ||
                    (mode == 'add' ? (
                        <Button>
                            <Plus className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button variant="ghost">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    ))}
            </DialogTrigger>

            <DialogContent
                className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
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
                            `Update the details for this item below.`
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Form */}
                <form
                    id="item-form"
                    onSubmit={handleSubmit}
                    className="space-y-6 flex-1 overflow-y-auto p-2"
                >
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-right">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                handleMainFieldChange('name', e.target.value)
                            }
                            className="col-span-3 break-words"
                            autoComplete="off"
                            required
                        />
                    </div>

                    {/* Status Toggle */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                            List Status
                        </Label>
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
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Tags</Label>
                        <TagInput
                            selectedTags={formData.tags || []}
                            existingTags={existingTags}
                            categoryDefId={categoryDef.id}
                            onTagsChange={(tags) =>
                                handleMainFieldChange('tags', tags)
                            }
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="description"
                            className="text-sm font-semibold"
                        >
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            className="max-h-80 min-h-[100px] resize-y"
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

                    {/* Dynamic Fields (if any) */}
                    {categoryDef.field_definitions.length > 0 && (
                        <>
                            <Separator className="my-6" />

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
                        </>
                    )}
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
