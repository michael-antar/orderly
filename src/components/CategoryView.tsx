import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

import { type Category, type CombinedItem, categoryTitles } from '@/types/types';
import { AddItemForm } from './AddItemForm';
import { ItemCard } from './ItemCard';

export const CategoryView = ({ category }: { category: Category }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CombinedItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('items')
                .select(`
                    *,
                    movie_details(*),
                    restaurant_details(*),
                    album_details(*),
                    book_details(*),
                    show_details(*)
                `)
                .eq('user_id', user.id)
                .eq('category', category);
            if (error) throw error;
            setItems(data || []);
        }
        catch (error) {
            console.error('Error fetching items:', error);
        }
        finally {
            setLoading(false);
        }
    }, [user, category]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between pb-4 border-b">
                <h1 className="text-4xl font-bold text-foreground">
                    {categoryTitles[category]}
                </h1>
                <AddItemForm category={category} onSuccess={fetchItems} />
            </header>
            <div className="flex-1 mt-6 overflow-y-auto">
                {loading ? (
                    <p>Loading items...</p>
                ) : items.length > 0 ? (
                    <div>
                        {items.map((item) => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <p>No items found. Add one to get started!</p>
                )}
            </div>
        </div>
    );
}