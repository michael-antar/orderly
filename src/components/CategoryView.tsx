import { useState, useEffect, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { PanelRightOpen } from 'lucide-react';

import { Button } from './ui/button';
import { ItemDetailView } from './ItemDetailView';
import { ItemForm } from './ItemForm';
import { SortControls } from './SortControls';
import { ItemList } from './ItemList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuth } from '@/contexts/AuthContext';

import { cn } from '@/lib/utils';
import {
    type Category,
    type CombinedItem,
    type Status,
    categoryTitles,
} from '@/types/types';

export const CategoryView = ({ category }: { category: Category }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CombinedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Status>('ranked'); // For passing down to form
    const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null); // For highlighting item in list and displaying item details
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false); // Handle detail view's visibility on small screens

    // Fetch list of items from database
    const getItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('items')
                .select(
                    `*, movie_details(*), restaurant_details(*), album_details(*), book_details(*), show_details(*)`,
                )
                .eq('user_id', user.id)
                .eq('category', category);
            if (error) throw error;
            setItems(data || []);
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching items:', error);
            return { data: [], error };
        } finally {
            setLoading(false);
        }
    }, [user, category]);

    // Initial fetch on component mount or category change
    useEffect(() => {
        getItems();
    }, [getItems]);

    // Toggle opening detail view on mobile
    useEffect(() => {
        setIsDetailViewOpen(selectedItem ? true : false);
    }, [selectedItem]);

    // When category changes, clear the selected item
    useEffect(() => {
        setSelectedItem(null);
    }, [category]);

    const rankedItems = useMemo(
        () => items.filter((item) => item.status === 'ranked'),
        [items],
    );
    const backlogItems = useMemo(
        () => items.filter((item) => item.status === 'backlog'),
        [items],
    );

    // Unselect item and set new active tab for form
    const handleTabChange = (value: Status) => {
        setSelectedItem(null);
        setActiveTab(value);
    };

    // Toggle selection of item
    const handleSelectItem = (item: CombinedItem) => {
        setSelectedItem((prev) => (prev?.id === item.id ? null : item));
    };

    // Refresh list
    const handleAddSuccess = (newStatus: Status) => {
        setActiveTab(newStatus);
        getItems();
    };

    // Set new active tab and refresh edited item
    const handleEditSuccess = async (newStatus: Status) => {
        setActiveTab(newStatus);

        const result = await getItems();
        if (result?.data && selectedItem) {
            const updatedItem = result.data.find(
                (item) => item.id === selectedItem.id,
            );
            setSelectedItem(updatedItem || null);
        }
    };

    // Unselect item and refresh list
    const handleDeleteSuccess = () => {
        setSelectedItem(null);
        getItems();
    };

    return (
        <div className="relative h-full overflow-hidden md:flex">
            {/* Left Column: Item List */}
            <div className="w-full h-full flex flex-col md:w-1/2">
                <Tabs
                    value={activeTab}
                    className="flex flex-col h-full gap-0"
                    onValueChange={(value) => handleTabChange(value as Status)}
                >
                    <header className="flex flex-col m-4 mb-0 gap-4 pb-4 border-b lg:flex-row lg:items-center lg:justify-between">
                        <h1 className="text-4xl font-bold text-foreground">
                            {categoryTitles[category]}
                        </h1>
                        <div className="flex items-center justify-between w-full lg:flex-1">
                            {/* Status Tabs */}
                            <TabsList>
                                <TabsTrigger value="ranked">Ranked</TabsTrigger>
                                <TabsTrigger value="backlog">
                                    Backlog
                                </TabsTrigger>
                            </TabsList>

                            {/* Sort Controls */}
                            <SortControls />

                            <div className="flex items-center gap-2">
                                {/* Add Item Button */}
                                <ItemForm
                                    category={category}
                                    onSuccess={(newStatus) =>
                                        handleAddSuccess(newStatus)
                                    }
                                    activeListStatus={activeTab}
                                />

                                {/* Reopen detail view button */}
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="md:hidden"
                                    onClick={() => setIsDetailViewOpen(true)}
                                    disabled={!selectedItem} // Disable button if no item is selected
                                >
                                    <PanelRightOpen />
                                    <span className="sr-only">
                                        Open details panel
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </header>

                    {/* Item List Container */}
                    <div
                        className="flex-1 p-4 pt-6 overflow-y-auto"
                        onClick={() => setSelectedItem(null)}
                    >
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
            <div
                className={cn(
                    'absolute top-0 right-0 h-full w-[85%] bg-background border-l transition-transform duration-300 ease-in-out z-30 md:static md:w-1/2 md:h-auto md:my-4 md:translate-x-0',
                    isDetailViewOpen ? 'translate-x-0' : 'translate-x-full',
                )}
            >
                <ItemDetailView
                    item={selectedItem}
                    activeListStatus={activeTab}
                    onClose={() => setIsDetailViewOpen(false)}
                    onEdit={handleEditSuccess}
                    onDelete={handleDeleteSuccess}
                />
            </div>
        </div>
    );
};
