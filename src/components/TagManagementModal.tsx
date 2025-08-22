import { useEffect, useState } from 'react';

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

import { type Category, categoryTitles, type Tag } from '@/types/types';

type TagManagementModal = {
    category: Category;
    onSuccess: () => void;
};

export const TagManagementModal = ({
    category,
    onSuccess,
}: TagManagementModal) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);

    // For creating a new tag
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    // Fetch user tags for category
    useEffect(() => {
        const fetchTags = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('tags')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('category', category)
                    .order('name', { ascending: true });

                if (error) throw error;
                setTags(data || []);
            } catch (error) {
                console.error('Error fetching tags:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchTags();
        }
    }, [isOpen, user, category]);

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
            setTags((prevTags) =>
                prevTags.map((tag) =>
                    tag.id === tagToRename.id ? { ...tag, name: newName } : tag,
                ),
            );
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
            setTags((prevTags) =>
                prevTags.filter((tag) => tag.id !== tagToDelete.id),
            );
            onSuccess();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Tags className="h-4 w-4" />
                    <span className="sr-only">Manage Tags</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Manage {categoryTitles[category]} Tags
                    </DialogTitle>
                    <DialogDescription>
                        Here you can rename or delete your custom tags for this
                        category.
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                {/* Display Tags */}
                <div className="py-4 px-2 max-h-[400px] overflow-y-auto">
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
                </div>

                {/* Add New Tag */}
                <div>
                    {isCreatingTag ? (
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="New tag name..."
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                autoFocus
                            />
                            <Button
                                variant="secondary"
                                onClick={() => setIsCreatingTag(false)}
                            >
                                Cancel
                            </Button>
                            <Button>Save</Button>
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
            </DialogContent>
        </Dialog>
    );
};
