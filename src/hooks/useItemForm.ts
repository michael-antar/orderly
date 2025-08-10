import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { categoryConfig } from '@/config/categoryConfig';
import { toast } from 'sonner';
import {
    type CombinedItem,
    type Item,
    type Category,
    type Status,
    type AnyDetails,
    type SupabaseMutationResponse,
    type ItemFormData
} from '@/types/types';

type FormMode = 'add' | 'edit';
type UseItemFormProps = {
    mode: FormMode;
    category?: Category; // Required for 'add' mode
    item?: CombinedItem; // Required for 'edit' mode
    onSuccess: () => void;
};

// Helper to parse integer values from form inputs
const parseOptionalInt = (value: any): number | null => {
    if (value === null || String(value).trim() === '') return null;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
};

export const useItemForm = ({ mode, category, item, onSuccess}: UseItemFormProps) => {
    const { user } = useAuth();
    const effectiveCategory = mode === 'add' ? category! : item!.category;
    const config = categoryConfig[effectiveCategory];

    // --- STATE MANAGEMENT ---
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial state is derived once from props
    const getInitialState = (): ItemFormData => {
        if (mode === "edit" && item) {
            const details = item[`${item.category}_details`];
            return {
                name: item.name,
                description: item.description || '',
                status: item.status,
                ...details
            };
        }
        return { name: '', description: '', status: 'ranked' }
    };

    const [formData, setFormData] = useState<ItemFormData>(getInitialState);

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- SUBMISSION LOGIC ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !user) return;
        setIsLoading(true);

        try {
            if (mode === "add") {
                await handleAddItem();
            }
            else {
                await handleEditItem();
            }
            toast.success(`Success!`, { description: `'${formData.name}' has been saved.` });
            onSuccess();
            setIsOpen(false);
        }
        catch (error: any) {
            toast.error("Something went wrong.", { description: error.message });
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = async () => {
        // Insert into 'items' table
        const itemToInsert: Omit<Item, 'id' | 'created_at' | 'comparison_count'> = {
            user_id: user!.id,
            name: formData.name!,
            category: effectiveCategory,
            status: formData.status as Status,
            rating: formData.status === 'ranked' ? 1000 : null,
            description: formData.description!.trim() === '' ? null : formData.description!,
        };

        const { data: newItem, error: itemError } = await supabase
            .from('items')
            .insert(itemToInsert)
            .select()
            .single();
        if (itemError) throw new Error('Failed to create a new item.');

        // Insert into category-specific 'details' table
        const detailsToInsert = getDetailsObject();
        const handler = config.handleDetailsInsert as (itemId: string, details: Partial<AnyDetails>) => SupabaseMutationResponse;
        const { error: detailsError } = await handler(newItem.id, detailsToInsert);

        if (detailsError) {
            // Rollback item creation if details fail
            await supabase.from('items').delete().eq('id', newItem.id);
            throw new Error('Failed to save item details.')
        }
    };

    const handleEditItem = async () => {
        const updatedItem: Partial<Item> = {
            name: formData.name,
            status: formData.status as Status,
            description: formData.description?.trim() === '' ? null : formData.description,
        }
        // If status has changed, update rating
        if (item && formData.status !== item.status) {
            updatedItem.rating = formData.status === 'ranked' ? 1000 : null
        }
        
        // Update 'items' table
        const { error: itemError } = await supabase
            .from('items')
            .update(updatedItem)
            .eq('id', item!.id);
        if (itemError) throw new Error('Failed to update the item.');

        // Update category-specific 'details' table
        const detailsToUpdate = getDetailsObject();
        const handler = config.handleDetailsUpdate as (itemId: string, details: Partial<AnyDetails>) => SupabaseMutationResponse;
        const { error: detailsError } = await handler(item!.id, detailsToUpdate);
        // TODO: Handle rollback
        if (detailsError) throw new Error('Failed to update item details.');
    };

    // Helper to extract only the relevant details for the current category
    const getDetailsObject = () => {
        const details: { [key: string]: any } = {};
        for (const field of config.fields) {
            // Handle number parsing for specific fields
            if (field.endsWith('_year') || field.endsWith('_order')) {
                details[field] = parseOptionalInt(formData[field as keyof typeof formData]);
            } else {
                const value = formData[field as keyof typeof formData];
                details[field] = typeof value === 'string' ? value.trim() || null : value || null;
            }
        }
        return details;
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
    };
}