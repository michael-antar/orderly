import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Tags, Trash2 } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { EditableTag } from './EditableTag';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import type { Tag } from '@/types/types';

type TagWithUsage = Tag & {
    is_used: boolean;
};

type TagManagerProps = {
    categoryDefId: string;
    onSuccess: () => void;
};

export const TagManager = ({ categoryDefId, onSuccess }: TagManagerProps) => {
    const { user } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<TagWithUsage[]>([]);

    // For creating a new tag
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    // For tracking unlinked tags
    const [unusedTags, setUnusedTags] = useState<TagWithUsage[]>([]);

    const fetchTags = useCallback(async () => {
        if (!user || !categoryDefId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tags')
                .select('*, item_tags(count)')
                .eq('user_id', user.id)
                .eq('category_def_id', categoryDefId)
                .order('name');

            if (error) throw error;

            const tagsWithUsage: TagWithUsage[] = (data || []).map(
                (t: any) => ({
                    id: t.id,
                    name: t.name,
                    category_def_id: t.category_def_id,
                    user_id: t.user_id,
                    // Check if the count > 0 to determine usage
                    is_used: (t.item_tags?.[0]?.count || 0) > 0,
                }),
            );

            setTags(tagsWithUsage);
            setUnusedTags(tagsWithUsage.filter((tag) => !tag.is_used));
        } catch (error) {
            console.error('Error fetching tags:', error);
            toast.error('Failed to load tags');
        } finally {
            setLoading(false);
        }
    }, [user, categoryDefId]);

    useEffect(() => {
        if (isOpen) {
            fetchTags();
        }
    }, [isOpen, fetchTags]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        // If the dialog is closing, reset the form state
        if (!open) {
            setIsCreatingTag(false);
            setNewTagName('');
        }
    };

    const handleRename = async (tagToRename: Tag, newName: string) => {
        const { error } = await supabase
            .from('tags')
            .update({ name: newName })
            .eq('id', tagToRename.id);

        if (error) {
            toast.error('Rename failed', {
                description: 'There was a problem renaming the tag.',
            });
        } else {
            toast.success('Tag renamed', {
                description: `'${tagToRename.name}' is now '${newName}'.`,
            });
            // Refresh local UI
            const updateTag = (tag: TagWithUsage) =>
                tag.id === tagToRename.id ? { ...tag, name: newName } : tag;

            setTags((prev) => prev.map(updateTag));
            setUnusedTags((prev) => prev.map(updateTag));
            onSuccess();
        }
    };

    const handleCreate = async () => {
        if (!newTagName.trim() || !user) return;

        // Check for duplicates
        if (
            tags.some(
                (tag) =>
                    tag.name.toLowerCase() === newTagName.trim().toLowerCase(),
            )
        ) {
            toast.error('Duplicate Tag', {
                description: 'A tag with this name already exists.',
            });
            return;
        }

        const { data, error } = await supabase
            .from('tags')
            .insert({
                name: newTagName.trim(),
                category_def_id: categoryDefId,
                user_id: user.id,
            })
            .select()
            .single();

        if (error || !data) {
            toast.error('Create failed', {
                description: 'There was a problem creating the new tag.',
            });
        } else {
            const newTag = data as Tag;
            // New tags are unused by default
            const newTagWithUsage: TagWithUsage = { ...newTag, is_used: false };

            toast.success('Tag created', {
                description: `'${newTag.name}' has been added to your tags.`,
            });

            const sorter = (a: Tag, b: Tag) => a.name.localeCompare(b.name);
            // Add to main tags and reorder
            setTags((prev) => [...prev, newTagWithUsage].sort(sorter));
            // Add tag to unused tag list
            setUnusedTags((prev) => [...prev, newTagWithUsage].sort(sorter));

            setNewTagName('');
            setIsCreatingTag(false);
            onSuccess();
        }
    };

    const handleDelete = async (tagToDelete: Tag) => {
        // Delete all associations from the junction table
        const { error: junctionError } = await supabase
            .from('item_tags')
            .delete()
            .eq('tag_id', tagToDelete.id);

        if (junctionError) {
            toast.error('Delete failed', {
                description: 'Could not remove tag from items.',
            });
            return;
        }

        // Delete the tag itself from the tags table
        const { error: tagError } = await supabase
            .from('tags')
            .delete()
            .eq('id', tagToDelete.id);

        if (tagError) {
            toast.error('Delete failed', {
                description: 'There was a problem deleting the tag.',
            });
        } else {
            toast.success('Tag deleted', {
                description: `'${tagToDelete.name}' has been permanently deleted.`,
            });

            // Refresh the list in the UI
            const filterOutDeleted = (tag: Tag) => tag.id !== tagToDelete.id;
            setTags((prev) => prev.filter(filterOutDeleted));
            setUnusedTags((prev) => prev.filter(filterOutDeleted));
            onSuccess();
        }
    };

    const handleDeleteUnused = async () => {
        if (unusedTags.length === 0) return;

        const unusedTagIds = unusedTags.map((tag) => tag.id);
        const { error } = await supabase
            .from('tags')
            .delete()
            .in('id', unusedTagIds);

        if (error) {
            toast.error('Delete failed', {
                description: 'There was a problem deleting unused tags.',
            });
        } else {
            toast.success('Unused tags deleted', {
                description: `${unusedTags.length} tag(s) have been removed.`,
            });

            // Refresh the UI
            setTags((prevTags) =>
                prevTags.filter((tag) => !unusedTagIds.includes(tag.id)),
            );
            setUnusedTags([]);
            onSuccess();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Tags className="h-4 w-4" />
                    <span className="sr-only">Manage Tags</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Tags</DialogTitle>
                    <DialogDescription>
                        Create, rename, or delete tags for this category.
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                {/* Display Tags */}
                <div className="pt-4 px-2 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <p className="text-sm text-center text-muted-foreground">
                            Loading tags...
                        </p>
                    ) : tags.length > 0 ? (
                        <ul className="space-y-2">
                            {tags.map((tag) => (
                                <li
                                    key={tag.id}
                                    className="flex items-center justify-between"
                                >
                                    <EditableTag
                                        tag={tag}
                                        onRename={handleRename}
                                    />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Are you sure?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete
                                                    the tag{' '}
                                                    <span className="font-semibold">
                                                        {tag.name}
                                                    </span>{' '}
                                                    and remove it from all
                                                    associated items.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        handleDelete(tag)
                                                    }
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground">
                            No tags found for this category.
                        </p>
                    )}

                    {/* Add New Tag */}
                    <div className="pt-5 pb-2">
                        {isCreatingTag ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    id="new-tag-name"
                                    name="new-tag-name"
                                    placeholder="New tag name..."
                                    value={newTagName}
                                    onChange={(e) =>
                                        setNewTagName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreate();
                                        if (e.key === 'Escape') {
                                            setIsCreatingTag(false);
                                            setNewTagName('');
                                        }
                                    }}
                                    autoFocus
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setIsCreatingTag(false);
                                        setNewTagName('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate}>Save</Button>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setIsCreatingTag(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Tag
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Footer */}
                <div>
                    {/* Delete Unused Tags */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="w-full"
                                disabled={unusedTags.length === 0 || loading}
                            >
                                Delete Unused Tags ({unusedTags.length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all tags that
                                    are not currently used on any items in this
                                    category. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteUnused}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </DialogContent>
        </Dialog>
    );
};
