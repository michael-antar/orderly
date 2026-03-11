import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import type { CategoryDefinition, Item, ItemFormData, ItemPropertyValue, Status, Tag } from '@/types/types';

type FormMode = 'add' | 'edit';

type UseItemFormProps = {
  /** Whether the form is creating a new item or editing an existing one. */
  mode: FormMode;
  categoryDef: CategoryDefinition;
  /** The item to pre-populate the form with. Required when `mode` is `'edit'`. */
  item?: Item;
  /**
   * The status to pre-select when creating a new item.
   * Typically the active tab in the parent list view so the form reflects where the user is.
   * Defaults to `'ranked'` when omitted.
   */
  defaultStatus?: Status;
  /** Called with the saved item's status and full refreshed data after a successful submit. */
  onSuccess: (newStatus: Status, newItem: Item) => void;
};

/**
 * Manages all state and async logic for the item create/edit dialog form.
 *
 * Handles form initialisation from props, field change handlers, tag synchronisation
 * with Supabase, and full item persistence on submit.
 *
 * @param mode - `'add'` to insert a new item, `'edit'` to update an existing one.
 * @param categoryDef - The parent category's schema, used to initialise dynamic property fields.
 * @param item - The item to pre-populate the form with (required when `mode` is `'edit'`).
 * @param defaultStatus - Status to pre-select for new items. Defaults to `'ranked'`.
 * @param onSuccess - Callback invoked with the saved item's status and refreshed data after a successful save.
 *
 * Side Effects:
 * - Fetches existing tags from Supabase when the dialog opens.
 * - Inserts or updates rows in the `items`, `tags`, and `item_tags` tables on submit.
 */
export const useItemForm = ({ mode, categoryDef, item, defaultStatus = 'ranked', onSuccess }: UseItemFormProps) => {
  const { user } = useAuth();

  // - State management -
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);

  // Initial state is derived once from props
  const getInitialState = useCallback((): ItemFormData => {
    // Base state
    const base = {
      name: item?.name || '',
      description: item?.description || '',
      status: item?.status || defaultStatus,
      rating: item?.rating ?? null,
      tags: item?.tags || [],
      properties: {},
    };

    // If editing, populate properties from the item
    if (mode === 'edit' && item) {
      return {
        ...base,
        properties: { ...item.properties },
      };
    }

    // If adding, initialize properties as empty
    // TODO: Initialize with defaults based on schema
    const initialProps: Record<string, ItemPropertyValue> = {};
    categoryDef.field_definitions.forEach((field) => {
      initialProps[field.key] = null;
    });

    return {
      ...base,
      properties: initialProps,
    };
  }, [mode, item, categoryDef, defaultStatus]);

  const [formData, setFormData] = useState<ItemFormData>(getInitialState);

  // A ref that tracks whether the form has been initialised for the current open session.
  // Using a ref (instead of relying on effect deps) ensures that re-renders caused by
  // upstream prop reference changes (e.g. categoryDef being re-fetched when the user
  // switches browser tabs) do NOT reset in-progress form data while the dialog is open.
  const hasInitialisedRef = useRef(false);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('category_def_id', categoryDef.id);

      setExistingTags(tags || []);
    };

    if (isOpen) {
      // Only initialise once per open session — guard against re-runs triggered
      // by reference-unstable deps (getInitialState, categoryDef, user) while
      // the form is already open (e.g. parent re-renders on browser tab focus).
      if (!hasInitialisedRef.current) {
        hasInitialisedRef.current = true;
        setFormData(getInitialState);
        fetchTags();
      }
    } else {
      // Form closed — reset the guard so the next open re-initialises cleanly.
      hasInitialisedRef.current = false;
    }
  }, [isOpen, getInitialState, categoryDef.id, user]);

  // Generic handler for main fields (name, description, etc.)
  const handleMainFieldChange = <K extends keyof Omit<ItemFormData, 'properties'>>(
    field: K,
    value: ItemFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Generic handler for dynamic properties
  const handlePropertyChange = (key: string, value: ItemPropertyValue) => {
    setFormData((prev) => ({
      ...prev,
      properties: {
        ...prev.properties,
        [key]: value,
      },
    }));
  };

  // --- Submission Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !user) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare payload, cleaning up empty values from properties
      const propertiesToSave = { ...formData.properties };

      const commonPayload = {
        name: formData.name,
        description: formData.description?.trim() || null,
        status: formData.status,
        rating: formData.status === 'ranked' ? (formData.rating ?? 1000) : null,
        properties: propertiesToSave,
        category_def_id: categoryDef.id,
      };

      let savedItem: Item;

      if (mode === 'add') {
        // Insert
        const { data, error } = await supabase
          .from('items')
          .insert({
            ...commonPayload,
            user_id: user.id,
            comparison_count: 0,
          })
          .select()
          .single();

        if (error) throw error;
        savedItem = data as Item;
      } else {
        // Update
        const { data, error } = await supabase.from('items').update(commonPayload).eq('id', item!.id).select().single();

        if (error) throw error;
        savedItem = data as Item;
      }

      await handleTagSync(savedItem.id, formData.tags);

      toast.success('Success!', {
        description: `'${savedItem.name}' saved.`,
      });

      const { data: refreshedItem } = await supabase.from('items').select('*, tags(*)').eq('id', savedItem.id).single();

      onSuccess(savedItem.status, refreshedItem as Item);
      setIsOpen(false);
    } catch (error: unknown) {
      console.error(error);

      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error('Error', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Synchronises the `item_tags` junction table to match the final tag selections.
   * Creates any new tags (identified by a temporary negative ID assigned by `TagInput`),
   * then links newly added tags and unlinks removed ones for the given item.
   *
   * @param itemId - The ID of the saved item to sync tags for.
   * @param finalTags - The desired final list of tags the item should have.
   * @throws {Error} If any Supabase create, link, or unlink operation fails.
   */
  const handleTagSync = async (itemId: string, finalTags: Tag[]) => {
    const originalTagIds = item?.tags?.map((t) => t.id) || [];

    // Tags created via TagInput are given a temporary negative ID (see TagInput.handleCreate).
    // Any tag with id < 0 needs to be inserted into the DB before linking.
    const tagsToCreate = finalTags.filter((t) => t.id < 0);
    let newTagIds: number[] = [];

    if (tagsToCreate.length > 0) {
      const payload = tagsToCreate.map((t) => ({
        name: t.name,
        user_id: user!.id,
        category_def_id: categoryDef.id,
      }));

      const { data: createdTags, error } = await supabase.from('tags').insert(payload).select('id');

      if (error) {
        throw new Error('Failed to create new tags.');
      }
      newTagIds = createdTags.map((t) => t.id);
    }

    // Collect all real (persisted) tag IDs - existing tags have positive IDs, newly created ones are now in newTagIds
    const realTagIds = [...finalTags.filter((t) => t.id > 0).map((t) => t.id), ...newTagIds];

    // Determine which tags to link and unlink
    const tagsToLink = realTagIds.filter((id) => !originalTagIds.includes(id));
    const tagsToUnlink = originalTagIds.filter((id) => !realTagIds.includes(id));

    // Perform the linking and unlinking in the junction 'item_tags' table
    if (tagsToLink.length > 0) {
      const { error } = await supabase
        .from('item_tags')
        .insert(tagsToLink.map((tag_id) => ({ item_id: itemId, tag_id })));
      if (error) {
        throw new Error('Failed to link new tags.');
      }
    }
    if (tagsToUnlink.length > 0) {
      const { error } = await supabase.from('item_tags').delete().eq('item_id', itemId).in('tag_id', tagsToUnlink);
      if (error) {
        throw new Error('Failed to unlink old tags.');
      }
    }
  };

  return {
    isOpen,
    setIsOpen,
    isLoading,
    formData,
    handleMainFieldChange,
    handlePropertyChange,
    handleSubmit,
    existingTags,
  };
};
