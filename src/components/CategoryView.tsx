import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

import { type Category, type CombinedItem, categoryTitles } from '@/types/types';
import { AddItemForm } from './AddItemForm';
import { ItemCard } from './ItemCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    const rankedItems = useMemo(() => items.filter(item => item.status === 'ranked'), [items]);
    const backlogItems = useMemo(() => items.filter(item => item.status === 'backlog'), [items]);

    return (
        <Tabs defaultValue="ranked" className="flex flex-col h-full">
            <header className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-8">
                    <h1 className="text-4xl font-bold text-foreground">
                        {categoryTitles[category]}
                    </h1>
                    <TabsList>
                        <TabsTrigger value="ranked">Ranked</TabsTrigger>
                        <TabsTrigger value="backlog">Backlog</TabsTrigger>
                    </TabsList>
                </div>
                <AddItemForm category={category} onSuccess={fetchItems} />
            </header>
            
            <div className="flex-1 mt-6 overflow-y-auto">
                <TabsContent value="ranked">
                    {loading ? <p>Loading items...</p> : rankedItems.length > 0 ? (
                        <div>
                            {rankedItems.map((item) => <ItemCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                        <p>No ranked items found.</p>
                    )}
                </TabsContent>
                <TabsContent value="backlog">
                    {loading ? <p>Loading items...</p> : backlogItems.length > 0 ? (
                        <div>
                            {backlogItems.map((item) => <ItemCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                        <p>No backlog items found.</p>
                    )}
                </TabsContent>
            </div>
        </Tabs>
    );
}