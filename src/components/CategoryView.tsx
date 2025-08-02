import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

import { type Category, categoryTitles } from '@/types/types';
import { AddItemForm } from './AddItemForm';

type Item = {
    id: string;
    name: string
}

export const CategoryView = ({ category }: { category: Category }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('items')
                .select('id, name')
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
                    <ul>
                        {items.map((item) => (
                            <li key={item.id} className="p-2 border-b">
                            {item.name}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No items found. Add one to get started!</p>
                )}
            </div>
        </div>
    );
}