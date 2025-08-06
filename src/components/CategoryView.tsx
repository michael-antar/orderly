import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

import { type Category, type CombinedItem, categoryTitles } from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddItemForm } from './AddItemForm';
import { ItemList } from './ItemList';
import { ItemDetailView } from './ItemDetailView';
import { Button } from './ui/button';
import { PanelRightOpen } from 'lucide-react';

export const CategoryView = ({ category }: { category: Category }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CombinedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null); // For highlighting item in list and displaying item details
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false); // Handle detail view's visibility on small screens

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

    // When an item is selected on a small screen
    useEffect(() => {
        // Automatically open detail view
        if (selectedItem) {
            setIsDetailViewOpen(true);
        }
        // Automatically close detail view if no item is selected
        else {
            setIsDetailViewOpen(false);
        }
    }, [selectedItem]);

    // When category changes, clear the selected item
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
        <div className="relative h-full overflow-hidden md:flex">
            {/* Left Column: Item List */}
            <div className="w-full h-full flex flex-col md:w-1/2">
                <Tabs defaultValue="ranked" className="flex flex-col h-full gap-0" onValueChange={() => setSelectedItem(null)}>
                    <header className="flex flex-col gap-4 p-4 pb-4 border-b lg:flex-row lg:items-center lg:justify-between">
                            <h1 className="text-4xl font-bold text-foreground">
                                {categoryTitles[category]}
                            </h1>
                            <div className="flex items-center justify-between w-full lg:flex-1">
                                <TabsList>
                                    <TabsTrigger value="ranked">Ranked</TabsTrigger>
                                    <TabsTrigger value="backlog">Backlog</TabsTrigger>
                                </TabsList>
                                <div className="flex items-center gap-2">
                                    <AddItemForm category={category} onSuccess={fetchItems} />
                                    {/* Reopen detail view button */}
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="md:hidden"
                                        onClick={() => setIsDetailViewOpen(true)}
                                        disabled={!selectedItem} // Disable button if no item is selected
                                    >
                                        <PanelRightOpen />
                                        <span className="sr-only">Open details panel</span>
                                    </Button>
                                </div>
                            </div>          
                    </header>
                    
                    {/* Item List Container */}
                    <div className="flex-1 p-4 pt-6 overflow-y-auto" onClick={() => setSelectedItem(null)}>
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

            {/* Overlay for mobile view */}
            {isDetailViewOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsDetailViewOpen(false)}
                />
            )}

            {/* Right Column: Detail View */}
            <div className={cn(
                "absolute top-0 right-0 h-full w-[85%] bg-background border-l transition-transform duration-300 ease-in-out z-30 md:static md:w-1/2 md:translate-x-0",
                isDetailViewOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <ItemDetailView item={selectedItem} onClose={() => setIsDetailViewOpen(false)} />
            </div>
        </div>
    );
}