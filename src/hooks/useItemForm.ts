import { useState, useMemo, useCallback, useEffect } from 'react';

import { supabase } from '@/lib/supabaseClient';

import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';

import { categoryConfig } from '@/config/categoryConfig';
import {
    type AnyDetails,
    type Category,
    type CombinedItem,
    type Item,
    type ItemFormData,
    type Status,
    type SupabaseMutationResponse,
    type Tag,
} from '@/types/types';

type FormMode = 'add' | 'edit';
type UseItemFormProps = {
    mode: FormMode;
    category?: Category; // Required for 'add' mode
    item?: CombinedItem; // Required for 'edit' mode
    onSuccess: (newStatus: Status) => void;
};

// Helper to parse integer values from form inputs
const parseOptionalInt = (value: string | number | null): number | null => {
    if (value === null || String(value).trim() === '') return null;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
};

export const useItemForm = ({
    mode,
    category,
    item,
    onSuccess,
}: UseItemFormProps) => {
    const { user } = useAuth();
    const effectiveCategory = mode === 'add' ? category! : item!.category;
    const config = categoryConfig[effectiveCategory];

    // --- STATE MANAGEMENT ---
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);

    // Initial state is derived once from props
    const getInitialState = useCallback((): ItemFormData => {
        if (mode === 'edit' && item) {
            const details = item[`${item.category}_details`];
            return {
                name: item.name,
                description: item.description || '',
                status: item.status,
                tags: item.tags || [],
                ...details,
            };
        }
        return { name: '', description: '', status: 'ranked', tags: [] };
    }, [mode, item]);

    const [formData, setFormData] = useState<ItemFormData>(getInitialState);

    // Reset state when item changes or form opens
    useEffect(() => {
        const fetchTags = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', user.id)
                .eq('category', effectiveCategory);

            if (error) {
                console.error('Error fetching tags:', error);
            } else {
                setAvailableTags(data || []);
            }
        };

        if (isOpen) {
            setFormData(getInitialState());
            fetchTags();
        }
    }, [isOpen, getInitialState, user, effectiveCategory]);

    const handleFieldChange = useCallback(
        <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    // --- SUBMISSION LOGIC ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !user) return;
        setIsLoading(true);

        try {
            if (mode === 'add') {
                await handleAddItem();
            } else {
                await handleEditItem();
            }
            toast.success(`Success!`, {
                description: `'${formData.name}' has been saved.`,
            });
            onSuccess(formData.status as Status);
            setIsOpen(false);
        } catch (error: unknown) {
            toast.error('Something went wrong.', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unknown error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = async () => {
        // Insert into 'items' table
        const itemToInsert: Omit<
            Item,
            'id' | 'created_at' | 'comparison_count' | 'tags'
        > = {
            user_id: user!.id,
            name: formData.name!,
            category: effectiveCategory,
            status: formData.status as Status,
            rating: formData.status === 'ranked' ? 1000 : null,
            description:
                formData.description!.trim() === ''
                    ? null
                    : formData.description!,
        };

        const { data: newItem, error: itemError } = await supabase
            .from('items')
            .insert(itemToInsert)
            .select()
            .single();
        if (itemError) throw new Error('Failed to create a new item.');

        try {
            // Perform inserts sequentially to ensure type safety and handle rollbacks
            const detailsToInsert = getDetailsObject();
            const handler = config.handleDetailsInsert as (
                itemId: string,
                details: Partial<AnyDetails>,
            ) => SupabaseMutationResponse;
            const { error: detailsError } = await handler(
                newItem.id,
                detailsToInsert,
            );
            if (detailsError) throw new Error('Failed to save item details.');

            await handleTagSync(newItem.id, formData.tags || []);
        } catch (error) {
            // If any of the subsequent inserts fail, roll back the main item creation
            await supabase.from('items').delete().eq('id', newItem.id);
            throw error; // Re-throw the error to be caught by handleSubmit
        }
    };

    const handleEditItem = async () => {
        const updatedItem: Partial<Item> = {
            name: formData.name,
            status: formData.status as Status,
            description:
                formData.description?.trim() === ''
                    ? null
                    : formData.description,
        };
        // If status has changed, update rating
        if (item && formData.status !== item.status) {
            updatedItem.rating = formData.status === 'ranked' ? 1000 : null;
        }

        // Update 'items' table
        const { error: itemError } = await supabase
            .from('items')
            .update(updatedItem)
            .eq('id', item!.id);
        if (itemError) throw new Error('Failed to update the item.');

        // Update category-specific 'details' table
        const detailsToUpdate = getDetailsObject();
        const handler = config.handleDetailsUpdate as (
            itemId: string,
            details: Partial<AnyDetails>,
        ) => SupabaseMutationResponse;
        const { error: detailsError } = await handler(
            item!.id,
            detailsToUpdate,
        );

        if (detailsError) {
            // Rollback the main item update if details update fails
            const { error: rollbackError } = await supabase
                .from('items')
                .update({
                    name: item!.name,
                    status: item!.status,
                    description: item!.description,
                    rating: item!.rating,
                })
                .eq('id', item!.id);
            if (rollbackError)
                console.error(
                    'CRITICAL: Failed to rollback item update.',
                    rollbackError,
                );
            throw new Error('Failed to update item details.');
        }

        // Sync tag data for item
        await handleTagSync(item!.id, formData.tags || []);
    };

    // Helper to extract only the relevant details for the current category
    const getDetailsObject = useCallback((): Partial<AnyDetails> => {
        const details: { [key: string]: string | number | null } = {};
        for (const field of config.fields) {
            const key = field as keyof ItemFormData;
            const value = formData[key] ?? null;

            // Prevents function from processing 'tags' array
            if (Array.isArray(value)) {
                continue;
            }

            if (field.endsWith('_year') || field.endsWith('_order')) {
                details[key] = parseOptionalInt(value ?? null);
            } else {
                details[key] =
                    typeof value === 'string'
                        ? value.trim() || null
                        : value || null;
            }
        }
        return details as Partial<AnyDetails>;
    }, [config.fields, formData]);

    const handleTagSync = async (itemId: string, finalTags: Tag[]) => {
        const originalTagIds = item?.tags?.map((t) => t.id) || [];

        // Create any new tags that were added by the user
        // New tags will have been created with a generated id using Date(now), which will always be over 1,000,000
        const tagsToCreate = finalTags.filter((t) => t.id > 1_000_000);
        let newTagIds: number[] = [];
        if (tagsToCreate.length > 0) {
            const { data: createdTags, error: createError } = await supabase
                .from('tags')
                .insert(
                    tagsToCreate.map((t) => ({
                        name: t.name,
                        category: t.category,
                        user_id: user!.id,
                    })),
                )
                .select('id');
            if (createError) throw new Error('Failed to create new tags.');
            newTagIds = createdTags.map((t) => t.id);
        }

        const allFinalTagIds = [
            ...finalTags.filter((t) => t.id < 1_000_000).map((t) => t.id),
            ...newTagIds,
        ];

        // Determine which tags to link and unlink
        const tagsToLink = allFinalTagIds.filter(
            (id) => !originalTagIds.includes(id),
        );
        const tagsToUnlink = originalTagIds.filter(
            (id) => !allFinalTagIds.includes(id),
        );

        // Perform the linking and unlinking in the junction 'item_tags' table
        if (tagsToLink.length > 0) {
            const { error } = await supabase
                .from('item_tags')
                .insert(
                    tagsToLink.map((tag_id) => ({ item_id: itemId, tag_id })),
                );
            if (error) throw new Error('Failed to link new tags.');
        }
        if (tagsToUnlink.length > 0) {
            const { error } = await supabase
                .from('item_tags')
                .delete()
                .eq('item_id', itemId)
                .in('tag_id', tagsToUnlink);
            if (error) throw new Error('Failed to unlink old tags.');
        }
    };

    // Memoize the FieldsComponent to prevent re-renders
    const FieldsComponent = useMemo(() => config.FieldsComponent, [config]);

    return {
        isOpen,
        setIsOpen,
        isLoading,
        formData,
        handleFieldChange,
        handleSubmit,
        FieldsComponent,
        mode,
        effectiveCategory,
        availableTags,
    };
};
