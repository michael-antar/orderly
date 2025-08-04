import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

import { type Category, type CombinedItem, categoryTitles } from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddItemForm } from './AddItemForm';
import { ItemList } from './ItemList';
import { ItemDetailView } from './ItemDetailView';

export const CategoryView = ({ category }: { category: Category }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CombinedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null);

    const fetchItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('items')
                .select(`*, movie_details(*), restaurant_details(*), album_details(*), book_details(*), show_details(*)`)
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

    // Unselect item when the category changes
    useEffect(() => {
        setSelectedItem(null);
    }, [category]);

    const rankedItems = useMemo(() => items.filter(item => item.status === 'ranked'), [items]);
    const backlogItems = useMemo(() => items.filter(item => item.status === 'backlog'), [items]);

    // Toggle selection of item
    const handleSelectItem = (item: CombinedItem) => {
        if (selectedItem?.id === item.id) {
            setSelectedItem(null);
        } else {
            setSelectedItem(item);
        }
    };

    return (
        // Horizontal flexbox
        <div className="flex h-full">
            {/* Left Column: Item List */}
            <div className="w-2/3 border-r p-4 flex flex-col">
                <Tabs defaultValue="ranked" className="flex flex-col h-full" onValueChange={() => setSelectedItem(null)}>
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
                    
                    <div className="flex-1 mt-6 overflow-y-auto" onClick={() => setSelectedItem(null)}>
                        <TabsContent value="ranked">
                            <ItemList
                                items={rankedItems}
                                loading={loading}
                                selectedItem={selectedItem}
                                onSelectItem={handleSelectItem}
                                emptyMessage="No ranked items found."
                            />
                        </TabsContent>
                        <TabsContent value="backlog">
                            <ItemList
                                items={backlogItems}
                                loading={loading}
                                selectedItem={selectedItem}
                                onSelectItem={handleSelectItem}
                                emptyMessage="No backlog items found."
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
            {/* Right Column: Detail View */}
            <div className="w-1/3">
                <ItemDetailView item={selectedItem} />
            </div>
        </div>
    );
}