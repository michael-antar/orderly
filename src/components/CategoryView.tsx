import { useState, useEffect, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { PanelRightOpen, Swords } from 'lucide-react';

import { Button } from './ui/button';
import { ComparisonModal } from './ComparisonModal';
import { ItemDetailView } from './ItemDetailView';
import { ItemForm } from './ItemForm';
import { SortControls } from './SortControls';
import { ItemList } from './ItemList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TagManager } from '@/components/TagManager';

import { useAuth } from '@/contexts/AuthContext';

import { cn } from '@/lib/utils';
import type { PostgrestError } from '@supabase/supabase-js';
import {
    type Category,
    type CombinedItem,
    type SortOption,
    type Status,
    categoryTitles,
} from '@/types/types';

export const CategoryView = ({ category }: { category: Category }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CombinedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Status>('ranked'); // For passing down to form

    // Handle DetailView
    const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null); // For highlighting item in list and displaying item details
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false); // Handle detail view's visibility on small screens

    // Handle list sorting
    const [sortBy, setSortBy] = useState<SortOption>('rating');
    const [sortAsc, setSortAsc] = useState(false);

    // Handle ComparisonModal
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [calibrationItem, setCalibrationItem] = useState<CombinedItem | null>(
        null,
    ); // Hold new item that needs calibration

    // Fetch list of items from database
    const getItems = useCallback(async () => {
        if (!user) return { data: [], error: null };
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('items')
                .select(
                    `*, tags(*), movie_details(*), restaurant_details(*), album_details(*), book_details(*), show_details(*)`,
                )
                .eq('user_id', user.id)
                .eq('category', category)
                .order(sortBy, { ascending: sortAsc, nullsFirst: false });
            if (error) throw error;
            setItems(data || []);
            return { data: data as CombinedItem[] | null, error: null };
        } catch (error) {
            console.error('Error fetching items:', error);
            return { data: [], error: error as PostgrestError };
        } finally {
            setLoading(false);
        }
    }, [user, category, sortBy, sortAsc]);

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

    // Always sorted list of ranked items by elo (desc), for use in comparison modal
    const comparisonRankedItems = useMemo(() => {
        return [...rankedItems].sort((a, b) => {
            if (a.rating === null) return 1;
            if (b.rating === null) return -1;
            return b.rating - a.rating;
        });
    }, [rankedItems]);

    // Unselect item and set new active tab for form
    const handleTabChange = (value: Status) => {
        setSelectedItem(null);
        setActiveTab(value);

        // Set default sorting based on selected tab
        if (value === 'backlog') {
            setSortBy('name'); // Alphabetical
            setSortAsc(true);
        } else {
            // ranked
            setSortBy('rating'); // Elo
            setSortAsc(false);
        }
    };

    // Toggle selection of item
    const handleSelectItem = (item: CombinedItem) => {
        setSelectedItem((prev) => (prev?.id === item.id ? null : item));
    };

    // Refresh list and start calibration
    const handleAddSuccess = async (
        newStatus: Status,
        newItem: CombinedItem,
    ) => {
        console.log('--- handleAddSuccess fired ---');
        setActiveTab(newStatus);
        const { data: updatedItems } = await getItems();

        if (newStatus === 'ranked' && updatedItems) {
            console.log('Original newItem from form:', newItem);
            console.log('Full updated list from DB:', updatedItems);

            // Search inside that fresh data for the item we care about
            const freshItem = updatedItems.find((i) => i.id === newItem.id);
            console.log('freshItem found in list:', freshItem);

            // Set the state with the correct, fresh object
            if (freshItem) {
                console.log(
                    'Passing this item to setCalibrationItem:',
                    freshItem,
                );
                setCalibrationItem(freshItem);
                setIsComparisonModalOpen(true);
            } else {
                console.error(
                    'DEBUG: Could not find freshItem in the updated list!',
                );
            }
        }
    };

    // Set new active tab, refresh edited item, and start calibration if moved to ranked
    const handleEditSuccess = async (
        newStatus: Status,
        updatedItem: CombinedItem,
    ) => {
        console.log('--- handleEditSuccess fired ---');
        console.log('updatedItem:', updatedItem);

        const previousStatus = selectedItem?.status;

        setActiveTab(newStatus);
        await getItems();

        // If item was successfully updated, check if it needs calibration
        setSelectedItem(updatedItem); // Keep detail view in sync

        // Check if item was moved from backlog to ranked
        if (previousStatus === 'backlog' && newStatus === 'ranked') {
            console.log(
                'Item moved from backlog to ranked, starting calibration for:',
                updatedItem,
            );
            setCalibrationItem(updatedItem);
            setIsComparisonModalOpen(true);
        }
    };

    const handleCalibrationComplete = () => {
        setCalibrationItem(null);
        setIsComparisonModalOpen(false);
        getItems();
    };

    // Unselect item and refresh list
    const handleDeleteSuccess = () => {
        setSelectedItem(null);
        getItems();
    };

    // Refresh both the list and the item detail view
    const handleTagUpdateSuccess = async () => {
        const result = await getItems();
        if (result?.data && selectedItem) {
            const updatedItem = result.data.find(
                (item) => item.id === selectedItem.id,
            );
            setSelectedItem(updatedItem || null);
        }
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

                            <div className="flex items-center gap-2">
                                {/* Sort Controls */}
                                <SortControls
                                    sortBy={sortBy}
                                    sortAsc={sortAsc}
                                    isEloDisabled={activeTab === 'backlog'}
                                    onSortByChange={setSortBy}
                                    onSortDirChange={() =>
                                        setSortAsc((prev) => !prev)
                                    }
                                />

                                {/* Tag Management Modal */}
                                <TagManager
                                    category={category}
                                    onSuccess={handleTagUpdateSuccess}
                                />

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        // Clear any leftover calibration item from a previous session
                                        setCalibrationItem(null);
                                        setIsComparisonModalOpen(true);
                                    }}
                                    disabled={
                                        activeTab === 'backlog' ||
                                        rankedItems.length < 2
                                    }
                                >
                                    <Swords className="h-4 w-4" />
                                    <span className="sr-only">
                                        Compare Items
                                    </span>
                                </Button>

                                <ComparisonModal
                                    open={isComparisonModalOpen}
                                    onOpenChange={setIsComparisonModalOpen}
                                    rankedItems={comparisonRankedItems}
                                    onSuccess={getItems}
                                    calibrationItem={calibrationItem}
                                    onCalibrationComplete={
                                        handleCalibrationComplete
                                    }
                                />

                                {/* Add Item Button */}
                                <ItemForm
                                    category={category}
                                    onSuccess={handleAddSuccess}
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
