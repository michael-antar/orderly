import { useItemForm } from '@/hooks/useItemForm';
import { type CombinedItem, type Category } from '@/types/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil } from 'lucide-react';

type ItemFormProps = {
    // Determine mode by checking if 'item' prop exists
    item?: CombinedItem;
    category?: Category;
    onSuccess: () => void;
};

export function ItemForm({ item, category, onSuccess }: ItemFormProps) {
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

    const capitalizedCategory = effectiveCategory.charAt(0).toUpperCase() + effectiveCategory.slice(1);
    const addModeStatusText = formData.status === 'ranked' ? 'Review' : 'to Backlog';
    const dialogTitle = mode === 'add'
        ? `Add New ${capitalizedCategory} ${addModeStatusText}`
        : `Edit ${item?.name}`;
    const statusText = formData.status === 'ranked' ? 'Review' : 'Notes';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {mode === 'add' ? (
                    <Button size="icon"><Plus className="h-4 w-4" /></Button>
                ) : (
                    <Button variant="ghost" size="icon"><Pencil className="h-5 w-5" /></Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>
                        {mode === 'add' ? (
                            <span>
                                Fields marked with <span className="text-destructive">*</span> are required.
                            </span>
                        ) : (
                            `Make changes to your item below.`
                        )}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Common Fields */}
                    <div className="flex items-center space-x-2 justify-start">
                        <Label htmlFor="status-switch">Add to Backlog</Label> 
                        <Switch
                            id="status-switch"
                            checked={formData.status === 'backlog'}
                            onCheckedChange={(checked) => handleFieldChange('status', checked ? 'backlog' : 'ranked')}
                        />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="col-span-3"
                            autoComplete="off"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">{statusText}</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
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
                        {isLoading ? 'Saving...' : mode === 'add' ? 'Add Item' : 'Save Changes'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}