import { GitMerge, Plus, Tags, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import type { Tag } from '@/types/types';

import { EditableTag } from './EditableTag';

export interface TagResponse extends Tag {
  item_tags: { count: number }[];
}

export interface TagWithUsage extends Tag {
  is_used: boolean;
  usage_count: number;
}

export interface TagManagerProps {
  categoryDefId: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog for tag management - create, rename, delete, and bulk-purge
 *
 * Side Effects:
 * - Fetches tag data from Supabase when the dialog opens.
 * - Mutates the `tags` and `item_tags` tables on create/rename/delete actions.
 */
export const TagManager = ({ categoryDefId, onSuccess, open: openProp, onOpenChange: onOpenChangeProp }: TagManagerProps) => {
  const { user } = useAuth();

  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? openProp : isOpenInternal;
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<TagWithUsage[]>([]);

  // For creating a new tag
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  // For merging tags
  const [mergeSource, setMergeSource] = useState<TagWithUsage | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  // For tracking unlinked tags
  const unusedTags = useMemo(() => tags.filter((tag) => !tag.is_used), [tags]);

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

      const rawData = data as unknown as TagResponse[];

      const tagsWithUsage: TagWithUsage[] = rawData.map((t) => {
        const count = t.item_tags?.[0]?.count || 0;
        return {
          id: t.id,
          name: t.name,
          category_def_id: t.category_def_id,
          user_id: t.user_id,
          is_used: count > 0,
          usage_count: count,
        };
      });

      setTags(tagsWithUsage);
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
    if (isControlled) {
      onOpenChangeProp?.(open);
    } else {
      setIsOpenInternal(open);
    }
    // If the dialog is closing, reset the form state
    if (!open) {
      setIsCreatingTag(false);
      setNewTagName('');
      setMergeSource(null);
      setMergeTargetId('');
    }
  };

  const handleRename = async (tagToRename: Tag, newName: string) => {
    const { error } = await supabase.from('tags').update({ name: newName }).eq('id', tagToRename.id);

    if (error) {
      toast.error('Rename failed', {
        description: 'There was a problem renaming the tag.',
      });
    } else {
      toast.success('Tag renamed', {
        description: `'${tagToRename.name}' is now '${newName}'.`,
      });
      // Refresh local UI and resort alphabetically
      setTags((prev) =>
        prev
          .map((tag) => (tag.id === tagToRename.id ? { ...tag, name: newName } : tag))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      onSuccess();
    }
  };

  const handleCreate = async () => {
    if (!newTagName.trim() || !user) return;

    // Check for duplicates
    if (tags.some((tag) => tag.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast.error('Duplicate Tag', { description: 'A tag with this name already exists.' });
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
      toast.error('Create failed', { description: 'There was a problem creating the new tag.' });
    } else {
      const newTag = data as Tag;
      const newTagWithUsage: TagWithUsage = { ...newTag, is_used: false, usage_count: 0 };

      toast.success('Tag created', { description: `'${newTag.name}' has been added to your tags.` });

      // Add to main tags and reorder
      setTags((prev) => [...prev, newTagWithUsage].sort((a, b) => a.name.localeCompare(b.name)));

      setNewTagName('');
      setIsCreatingTag(false);
      onSuccess();
    }
  };

  const handleDelete = async (tagToDelete: Tag) => {
    // Clear merge source if the tag being deleted is selected for merge
    if (mergeSource?.id === tagToDelete.id) {
      setMergeSource(null);
      setMergeTargetId('');
    }

    // ON DELETE CASCADE on item_tags.tag_id handles junction table cleanup
    const { error } = await supabase.from('tags').delete().eq('id', tagToDelete.id);

    if (error) {
      toast.error('Delete failed', { description: 'There was a problem deleting the tag.' });
    } else {
      toast.success('Tag deleted', { description: `'${tagToDelete.name}' has been permanently deleted.` });

      setTags((prev) => prev.filter((tag) => tag.id !== tagToDelete.id));
      onSuccess();
    }
  };

  const handleDeleteUnused = async () => {
    if (unusedTags.length === 0) return;

    const unusedTagIds = unusedTags.map((tag) => tag.id);
    const { error } = await supabase.from('tags').delete().in('id', unusedTagIds);

    if (error) {
      toast.error('Delete failed', { description: 'There was a problem deleting unused tags.' });
    } else {
      toast.success('Unused tags deleted', { description: `${unusedTags.length} tag(s) have been removed.` });

      // Refresh the UI
      setTags((prevTags) => prevTags.filter((tag) => !unusedTagIds.includes(tag.id)));
      onSuccess();
    }
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTargetId) return;
    const targetTag = tags.find((t) => String(t.id) === mergeTargetId);
    if (!targetTag) return;

    try {
      // Find items that already have the target tag to avoid unique constraint violations
      const { data: targetItems, error: fetchError } = await supabase
        .from('item_tags')
        .select('item_id')
        .eq('tag_id', targetTag.id);

      if (fetchError) throw fetchError;

      const targetItemIds = (targetItems ?? []).map((r) => r.item_id);

      // Remove source associations where item already has the target tag
      if (targetItemIds.length > 0) {
        const { error: dupeError } = await supabase
          .from('item_tags')
          .delete()
          .eq('tag_id', mergeSource.id)
          .in('item_id', targetItemIds);

        if (dupeError) throw dupeError;
      }

      // Reassign remaining source associations to the target tag
      const { error: updateError } = await supabase
        .from('item_tags')
        .update({ tag_id: targetTag.id })
        .eq('tag_id', mergeSource.id);

      if (updateError) throw updateError;

      // Delete the now-empty source tag
      const { error: deleteError } = await supabase.from('tags').delete().eq('id', mergeSource.id);
      if (deleteError) throw deleteError;

      toast.success('Tags merged', {
        description: `'${mergeSource.name}' has been merged into '${targetTag.name}'.`,
      });

      setMergeSource(null);
      setMergeTargetId('');
      onSuccess();
      fetchTags();
    } catch (error) {
      console.error('Error merging tags:', error);
      toast.error('Merge failed', { description: 'There was a problem merging the tags.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Tags className="h-4 w-4" />
            <span className="sr-only">Manage Tags</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>Create, rename, merge, or delete tags for this category.</DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Display Tags */}
        <div className="pt-4 px-2 max-h-[400px] overflow-y-auto">
          {/* Merge Panel */}
          {mergeSource && (
            <div className="mb-3 rounded-md border bg-muted/50 p-3">
              <p className="text-sm font-medium mb-2">
                Merge &ldquo;{mergeSource.name}&rdquo; into:
              </p>
              <div className="flex items-center gap-2">
                <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select target tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tags
                      .filter((t) => t.id !== mergeSource.id)
                      .map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name} ({t.usage_count})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!mergeTargetId} onClick={handleMerge}>
                  Merge
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMergeSource(null);
                    setMergeTargetId('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-center text-muted-foreground">Loading tags...</p>
          ) : tags.length > 0 ? (
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li key={tag.id} className="flex items-center gap-2">
                  <EditableTag tag={tag} onRename={handleRename} />
                  <span
                    className="ml-auto shrink-0 text-xs text-muted-foreground"
                    title={`Used by ${tag.usage_count} item${tag.usage_count !== 1 ? 's' : ''}`}
                  >
                    {tag.usage_count} {tag.usage_count === 1 ? 'item' : 'items'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Merge into another tag"
                    disabled={tags.length < 2}
                    onClick={() => {
                      setMergeSource(tag);
                      setMergeTargetId('');
                    }}
                  >
                    <GitMerge className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the tag <span className="font-semibold">{tag.name}</span> and
                          remove it from all associated items.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(tag)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center text-muted-foreground">No tags found for this category.</p>
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
                  onChange={(e) => setNewTagName(e.target.value)}
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
              <Button variant="ghost" className="w-full" onClick={() => setIsCreatingTag(true)}>
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
              <Button variant="destructive" className="w-full" disabled={unusedTags.length === 0 || loading}>
                Delete Unused Tags ({unusedTags.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all tags that are not currently used on any items in this category. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUnused}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};
