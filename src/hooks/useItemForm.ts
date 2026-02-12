import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type {
    CategoryDefinition,
    Item,
    ItemFormData,
    ItemPropertyValue,
    Status,
    Tag,
} from '@/types/types';

type FormMode = 'add' | 'edit';

type UseItemFormProps = {
    mode: FormMode;
    categoryDef: CategoryDefinition;
    item?: Item; // Required for 'edit' mode
    onSuccess: (newStatus: Status, newItem: Item) => void;
};

export const useItemForm = ({
    mode,
    categoryDef,
    item,
    onSuccess,
}: UseItemFormProps) => {
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
            status: item?.status || 'ranked',
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
    }, [mode, item, categoryDef]);

    const [formData, setFormData] = useState<ItemFormData>(getInitialState);

    // Reset state when form opens
    // TODO: Will this reset state when switching google tabs?
    useEffect(() => {
        const fetchTags = async () => {
            if (!user) return;
            // Fetch tags linked to this user + category def
            // TODO: 'tags' table currently still uses category_types instead of dynamic category_definitions.id
            const { data: tags } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', user.id)
                .eq('category_def_id', categoryDef.id);

            setExistingTags(tags || []);
        };
        if (isOpen) {
            setFormData(getInitialState);
            fetchTags();
        }
    }, [isOpen, getInitialState, categoryDef.id, user]);

    // Generic handler for main fields (name, description, etc.)
    const handleMainFieldChange = <
        K extends keyof Omit<ItemFormData, 'properties'>,
    >(
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

        console.group(`[handleSubmit] Submitting form in '${mode}' mode`);
        console.log('Initial form data:', formData);
        console.log('User present:', !!user);

        if (!formData.name || !user) {
            console.warn('Submission aborted: Missing name or user');
            console.groupEnd();
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
                rating:
                    formData.status === 'ranked'
                        ? (formData.rating ?? 1000)
                        : null,
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
                const { data, error } = await supabase
                    .from('items')
                    .update(commonPayload)
                    .eq('id', item!.id)
                    .select()
                    .single();

                if (error) throw error;
                savedItem = data as Item;
            }

            await handleTagSync(savedItem.id, formData.tags);

            toast.success('Success!', {
                description: `'${savedItem.name}' saved.`,
            });

            const { data: refreshedItem } = await supabase
                .from('items')
                .select('*, tags(*)')
                .eq('id', savedItem.id)
                .single();

            onSuccess(savedItem.status, refreshedItem as Item);
            setIsOpen(false);
        } catch (error: unknown) {
            console.error(error);

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred';
            toast.error('Error', { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTagSync = async (itemId: string, finalTags: Tag[]) => {
        console.group('[handleTagSync] Syncing tags');

        const originalTagIds = item?.tags?.map((t) => t.id) || [];
        console.log({
            itemId: itemId,
            finalTags: finalTags,
            originalTags: item?.tags,
            originalTagIds: originalTagIds,
        });

        // Create any new tags that were added by the user
        // New tags will have been created with a generated id using Date(now), which will always be over 1,000,000
        const tagsToCreate = finalTags.filter((t) => t.id > 1_000_000);
        let newTagIds: number[] = [];

        if (tagsToCreate.length > 0) {
            console.log('Tags to create:', tagsToCreate);

            const payload = tagsToCreate.map((t) => ({
                name: t.name,
                user_id: user!.id,
                category_def_id: categoryDef.id,
            }));
            console.log('Creating new tags with payload:', payload);

            const { data: createdTags, error } = await supabase
                .from('tags')
                .insert(payload)
                .select('id');

            if (error) {
                console.error('Error creating new tags:', error);
                console.groupEnd();
                throw new Error('Failed to create new tags.');
            }
            newTagIds = createdTags.map((t) => t.id);
            console.log('Successfully created tags. New IDs:', newTagIds);
        } else {
            console.log('No new tags to create.');
        }

        const realTagIds = [
            ...finalTags.filter((t) => t.id < 1_000_000).map((t) => t.id),
            ...newTagIds,
        ];
        console.log('All final tag IDs for linking:', realTagIds);

        // Determine which tags to link and unlink
        const tagsToLink = realTagIds.filter(
            (id) => !originalTagIds.includes(id),
        );
        const tagsToUnlink = originalTagIds.filter(
            (id) => !realTagIds.includes(id),
        );
        console.log('Tags to link (junction table insert):', tagsToLink);
        console.log('Tags to unlink (junction table delete):', tagsToUnlink);

        // Perform the linking and unlinking in the junction 'item_tags' table
        if (tagsToLink.length > 0) {
            console.log(`Linking tags for item_id ${itemId}:`, tagsToLink);
            const { error } = await supabase
                .from('item_tags')
                .insert(
                    tagsToLink.map((tag_id) => ({ item_id: itemId, tag_id })),
                );
            if (error) {
                console.error('Error linking tags:', error);
                console.groupEnd();
                throw new Error('Failed to link new tags.');
            }
            console.log('Successfully linked tags.');
        }
        if (tagsToUnlink.length > 0) {
            console.log(`Unlinking tags for item_id ${itemId}:`, tagsToUnlink);
            const { error } = await supabase
                .from('item_tags')
                .delete()
                .eq('item_id', itemId)
                .in('tag_id', tagsToUnlink);
            if (error) {
                console.error('Error unlinking tags:', error);
                console.groupEnd();
                throw new Error('Failed to unlink old tags.');
            }
            console.log('Successfully unlinked tags.');
        }
        console.groupEnd();
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
