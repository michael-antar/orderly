import { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicIcon } from './DynamicIcon';
import { CategoryBuilder } from './CategoryBuilder';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import type { CategoryDefinition } from '@/types/types';

export const CategoryManager = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
        null,
    );

    const [categories, setCategories] = useState<CategoryDefinition[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch categories when modal opens or view returns to list
    const fetchCategories = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('category_definitions')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error(error);
            toast.error('Failed to load categories');
        } else if (data) {
            setCategories(data as unknown as CategoryDefinition[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen && view === 'list') {
            fetchCategories();
        }
    }, [isOpen, view, user]);

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('category_definitions')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Delete failed', { description: error.message });
        } else {
            toast.success('Category deleted');
            fetchCategories(); // Refresh list
        }
    };

    const handleEdit = (id: string) => {
        setSelectedCategoryId(id);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedCategoryId(null);
        setView('create');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedCategoryId(null);
        fetchCategories();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                // Reset to list view when closing
                if (!open) setTimeout(() => setView('list'), 300);
            }}
        >
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                >
                    <Settings className="mr-2 h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
                <div className="p-6 pb-4 border-b">
                    <DialogHeader>
                        <DialogTitle>
                            {view === 'list'
                                ? 'My Categories'
                                : view === 'create'
                                  ? 'Create Category'
                                  : 'Edit Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {view === 'list'
                                ? 'Manage your ranking lists and data schemas.'
                                : 'Define the fields and appearance for this category.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {view === 'list' ? (
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-center text-muted-foreground text-sm py-8">
                                    Loading...
                                </p>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                                    <p className="text-muted-foreground mb-4">
                                        You haven't created any custom
                                        categories yet.
                                    </p>
                                    <Button onClick={handleCreate}>
                                        Create Your First Category
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {categories.map((cat) => (
                                        // TODO: Make clickable. For editing? Viewing maybe?
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-muted rounded-md group-hover:bg-background transition-colors">
                                                    <DynamicIcon
                                                        name={cat.icon}
                                                        className="h-5 w-5 text-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm">
                                                        {cat.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            cat
                                                                .field_definitions
                                                                .length
                                                        }{' '}
                                                        custom fields
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleEdit(cat.id)
                                                    }
                                                    title="Edit Schema"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            title="Delete Category"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Delete "
                                                                {cat.name}"?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will
                                                                permanently
                                                                delete this
                                                                category and{' '}
                                                                <span className="font-bold text-destructive">
                                                                    ALL items
                                                                </span>{' '}
                                                                associated with
                                                                it. This action
                                                                cannot be
                                                                undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive hover:bg-destructive/90"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        cat.id,
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Placeholder for the builder
                        <CategoryBuilder
                            categoryId={selectedCategoryId}
                            onSave={handleBackToList}
                            onCancel={handleBackToList}
                        />
                    )}
                </div>

                {view === 'list' && (
                    <div className="p-4 border-t bg-muted/10">
                        <Button className="w-full" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Category
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
