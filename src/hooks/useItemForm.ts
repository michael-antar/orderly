import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

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
    onSuccess: (newStatus: Status, newItem: CombinedItem) => void;
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

    const prevIsOpenRef = useRef(isOpen);

    // Reset state when item changes or form opens
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            const fetchTags = async () => {
                console.groupCollapsed(`[fetchTags] Fetching tags`);

                if (!user) {
                    console.warn('Cannot fetch tags: user is not available.');
                    console.groupEnd();
                    return;
                }

                console.log('Fetching tags for:', {
                    userId: user.id,
                    category: effectiveCategory,
                });
                const { data: tags, error } = await supabase
                    .from('tags')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('category', effectiveCategory);

                if (error) {
                    console.error('Error fetching tags:', error);
                } else {
                    console.log('Successfully fetched tags:', tags);
                    setAvailableTags(tags || []);
                }
                console.groupEnd();
            };

            const runEffect = async () => {
                console.groupCollapsed(
                    '[useEffect] Item Form opened, resetting state and fetching data.',
                );

                console.log('Resetting form data to initial state.');
                setFormData(getInitialState());

                console.log('--> Executing: fetchTags');
                await fetchTags();

                console.groupEnd();
            };

            runEffect();
        }

        prevIsOpenRef.current = isOpen;
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
            let newItem: CombinedItem | null = null;
            if (mode === 'add') {
                console.log('--> Executing: handleAddItem');
                newItem = await handleAddItem();
            } else {
                console.log('--> Executing: handleEditItem');
                newItem = await handleEditItem();
            }
            toast.success(`Success!`, {
                description: `'${formData.name}' has been saved.`,
            });
            console.log('Submission successful. Calling onSuccess callback.', {
                status: formData.status,
                newItem: newItem,
            });
            onSuccess(formData.status as Status, newItem);
            setIsOpen(false);
        } catch (error: unknown) {
            console.error('Submission failed:', error);
            toast.error('Something went wrong.', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unknown error occurred.',
            });
        } finally {
            setIsLoading(false);
            console.groupEnd();
        }
    };

    const handleAddItem = async () => {
        console.group(
            '[handleAddItem] Inserting new item to tables and returning new item',
        );
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

        console.log('Inserting into "items" table. Payload:', itemToInsert);
        const { data: newItem, error: itemError } = await supabase
            .from('items')
            .insert(itemToInsert)
            .select()
            .single();
        if (itemError) {
            console.error('Error inserting item:', itemError);
            console.groupEnd();
            throw new Error('Failed to create a new item.');
        }
        console.log('Item insertion successful. Result:', newItem);

        try {
            // Perform inserts sequentially to ensure type safety and handle rollbacks
            const detailsToInsert = getDetailsObject();

            console.log('Inserting item details. Payload:', detailsToInsert);
            const handler = config.handleDetailsInsert as (
                itemId: string,
                details: Partial<AnyDetails>,
            ) => SupabaseMutationResponse;
            const { error: detailsError } = await handler(
                newItem.id,
                detailsToInsert,
            );
            if (detailsError) {
                console.error('Error inserting item details:', detailsError);
                throw new Error('Failed to save item details.');
            }
            console.log('Item details insertion successful.');

            // Sync tag data for item
            console.log('--> Executing: handleTagSync', {
                itemId: newItem.id,
                finalTags: formData.tags,
            });
            await handleTagSync(newItem.id, formData.tags || []);
            console.log('Tag sync successful.');
        } catch (error) {
            // If any of the subsequent inserts fail, roll back the main item creation
            console.error(
                'Error during details/tag sync. Rolling back...',
                error,
            );
            await supabase.from('items').delete().eq('id', newItem.id);
            console.groupEnd();
            throw error; // Re-throw the error to be caught by handleSubmit
        }

        console.log('Returning new item:', newItem as CombinedItem);
        console.groupEnd();
        return newItem as CombinedItem;
    };

    const handleEditItem = async () => {
        console.groupCollapsed('[handleEditItem] Logic');

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
            const updatedRating = formData.status === 'ranked' ? 1000 : null;
            console.log(
                `Item status changed to ${updatedItem.status}, setting rating to ${updatedRating}`,
            );
            updatedItem.rating = updatedRating;
        }

        // Update 'items' table
        console.log('Updating "items" table. Payload:', updatedItem);
        const { error: itemError } = await supabase
            .from('items')
            .update(updatedItem)
            .eq('id', item!.id);
        if (itemError) {
            console.error('Error updating item:', updatedItem);
            console.groupEnd();
            throw new Error('Failed to update the item.');
        }
        console.log('Item update successful.');

        const detailsToUpdate = getDetailsObject();
        try {
            // Update category-specific 'details' table
            console.log('Updating item details. Payload:', detailsToUpdate);
            const handler = config.handleDetailsUpdate as (
                itemId: string,
                details: Partial<AnyDetails>,
            ) => SupabaseMutationResponse;
            const { error: detailsError } = await handler(
                item!.id,
                detailsToUpdate,
            );
            if (detailsError) {
                console.error('Error updating item details:', detailsError);
                throw new Error('Failed to update item details.');
            }
            console.log('Item details update successful.');

            // Sync tag data for item
            console.log('--> Executing: handleTagSync', {
                itemId: item!.id,
                tags: formData.tags,
            });
            await handleTagSync(item!.id, formData.tags || []);
            console.log('Tag sync successful.');
        } catch (error) {
            // If any of the subsequent updates fail, roll back the main item update
            console.error(
                'Error during details/tag sync. Rolling back...',
                error,
            );
            const { error: rollbackError } = await supabase
                .from('items')
                .update({
                    name: item!.name,
                    status: item!.status,
                    description: item!.description,
                    rating: item!.rating,
                })
                .eq('id', item!.id);
            if (rollbackError) {
                console.error('Failed to rollback item update.', rollbackError);
            }

            console.groupEnd();
            throw error;
        }

        // const fullUpdatedItem: CombinedItem = {
        //     ...item!,
        //     ...updatedItem,
        // };

        // console.log('Returning updated item:', fullUpdatedItem);
        // console.groupEnd();
        // return fullUpdatedItem as CombinedItem;

        console.log('Re-fetching updated item to ensure data consistency...');
        const detailTables = Object.keys(categoryConfig)
            .map((key) => `${key}_details(*)`)
            .join(',');
        const selectString = `*, tags(*), ${detailTables}`;

        const { data: refreshedItem, error: fetchError } = await supabase
            .from('items')
            .select(selectString)
            .eq('id', item!.id)
            .single();

        if (fetchError) {
            console.error('Failed to re-fetch updated item:', fetchError);
            const fullUpdatedItem: CombinedItem = { ...item!, ...updatedItem };
            return fullUpdatedItem;
        }

        console.log('Returning updated item:', refreshedItem);
        console.groupEnd();
        return refreshedItem as unknown as CombinedItem;
    };

    // Helper to extract only the relevant details for the current category
    const getDetailsObject = useCallback((): Partial<AnyDetails> => {
        console.groupCollapsed(
            '[getDetailsObject] Constructing details payload',
        );
        console.log('Source formData:', formData);
        console.log('Relevant fields for category:', config.fields);

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
        console.log('Constructed details object:', details);
        console.groupEnd();
        return details as Partial<AnyDetails>;
    }, [config.fields, formData]);

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
                category: t.category,
                user_id: user!.id,
            }));
            console.log('Creating new tags with payload:', payload);

            const { data: createdTags, error: createError } = await supabase
                .from('tags')
                .insert(payload)
                .select('id');
            if (createError) {
                console.error('Error creating new tags:', createError);
                console.groupEnd();
                throw new Error('Failed to create new tags.');
            }
            newTagIds = createdTags.map((t) => t.id);
            console.log('Successfully created tags. New IDs:', newTagIds);
        } else {
            console.log('No new tags to create.');
        }

        const allFinalTagIds = [
            ...finalTags.filter((t) => t.id < 1_000_000).map((t) => t.id),
            ...newTagIds,
        ];
        console.log('All final tag IDs for linking:', allFinalTagIds);

        // Determine which tags to link and unlink
        const tagsToLink = allFinalTagIds.filter(
            (id) => !originalTagIds.includes(id),
        );
        const tagsToUnlink = originalTagIds.filter(
            (id) => !allFinalTagIds.includes(id),
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
