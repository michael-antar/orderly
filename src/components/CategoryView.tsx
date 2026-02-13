import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, PanelRightOpen, Swords } from 'lucide-react';

import { Button } from './ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonModal } from './ComparisonModal';
import { ItemDetailView } from './ItemDetailView';
import { ItemForm } from './ItemForm';
import { SortControls } from './SortControls';
import { ItemList } from './ItemList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TagManager } from '@/components/TagManager';

import { useAuth } from '@/contexts/AuthContext';
import { usePrevious } from '@/hooks/usePrevious';

import { cn } from '@/lib/utils';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
    CategoryDefinition,
    Item,
    AppliedFilters,
    Status,
} from '@/types/types';

export const CategoryView = ({ categoryId }: { categoryId: string }) => {
    const { user } = useAuth();

    // Category Schema
    const [categoryDef, setCategoryDef] = useState<CategoryDefinition | null>(
        null,
    );
    const defLoading = !categoryDef;

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PostgrestError | null>(null);
    const [activeTab, setActiveTab] = useState<Status>('ranked'); // For passing down to form

    // Handle DetailView
    const [selectedItem, setSelectedItem] = useState<Item | null>(null); // For highlighting item in list and displaying item details
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false); // Handle detail view's visibility on small screens

    // Handle list sorting/filtering
    const [sortBy, setSortBy] = useState<string>('rating');
    const [sortAsc, setSortAsc] = useState<boolean>(false);
    const [filters, setFilters] = useState<AppliedFilters>({
        tags: [],
        rules: [],
    });

    // Handle ComparisonModal
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [calibrationItem, setCalibrationItem] = useState<Item | null>(null); // Hold new item that needs calibration

    const prevCategoryId = usePrevious(categoryId);

    // Fetch the CategoryDefinition (schema)
    useEffect(() => {
        const fetchDefinition = async () => {
            if (!categoryId || !user) return;

            const { data, error } = await supabase
                .from('category_definitions')
                .select('*')
                .eq('id', categoryId)
                .single();

            if (data) {
                setCategoryDef(data as unknown as CategoryDefinition);
            } else if (error) {
                console.error('Error fetching category definition:', error);
                setError(error);
            }
        };

        fetchDefinition();
    }, [categoryId, user]);

    // Fetch items
    const getItems = useCallback(async () => {
        if (!user || !categoryDef) return { data: [], error: null };

        console.groupCollapsed(`[getItems] Fetching ${categoryDef.name} items`);
        setLoading(true);
        setError(null);

        try {
            // Base query
            let query = supabase
                .from('items')
                .select('*, tags(*)')
                .eq('user_id', user.id)
                .eq('category_def_id', categoryDef.id);

            // Search using tag filters if included
            if (filters.tags.length > 0) {
                const tagIds = filters.tags.map((tag) => tag.id);
                query = supabase
                    .from('items')
                    .select('*, tags!inner(*)')
                    .eq('user_id', user.id)
                    .eq('category_def_id', categoryDef.id)
                    .in('tags.id', tagIds);
            }

            // Add field filters if included
            filters.rules.forEach((rule) => {
                if (!rule.field_key || !rule.operator || rule.value === '')
                    return;

                let column = rule.field_key;

                const standardColumns = [
                    'id',
                    'name',
                    'status',
                    'rating',
                    'created_at',
                    'description',
                ];

                if (column.startsWith('properties.')) {
                    const key = column.split('.')[1];
                    // Use arrow syntax for JSON path: properties->>key (text)
                    column = `properties->>${key}`;
                } else if (!standardColumns.includes(column)) {
                    column = `properties->>${column}`;
                }

                const val = String(rule.value);

                switch (rule.operator) {
                    case 'is':
                        query = query.eq(column, val); // 'eq' is safer than ilike for non-text
                        break;
                    case 'is_not':
                        query = query.neq(column, val);
                        break;
                    case 'contains':
                        query = query.ilike(column, `%${val}%`);
                        break;
                    case 'gt':
                        query = query.gt(column, val);
                        break;
                    case 'gte':
                        query = query.gte(column, val);
                        break;
                    case 'lt':
                        query = query.lt(column, val);
                        break;
                    case 'lte':
                        query = query.lte(column, val);
                        break;
                }
            });

            // Apply sorting
            let sortColumn = sortBy;
            // Map "properties.key" to "properties->key" or "properties->>key" for sorting
            // TODO: This might get iffy when trying to sort with Numerical field, but this works for now
            if (sortBy.startsWith('properties.')) {
                const key = sortBy.split('.')[1];
                sortColumn = `properties->>${key}`;
            }

            const { data, error } = await query.order(sortColumn, {
                ascending: sortAsc,
                nullsFirst: false,
            });

            if (error) throw error;

            console.log('Fetched Items:', data);
            setItems((data as Item[]) || []);
            return { data: (data as Item[]) || null, error: null };
        } catch (error) {
            console.error('Error fetching items:', error);
            setError(error as PostgrestError);
            return { data: [], error: error as PostgrestError };
        } finally {
            console.groupEnd();
            setLoading(false);
        }
    }, [user, categoryDef, filters, sortBy, sortAsc]);

    // Initial fetch
    useEffect(() => {
        if (categoryDef) {
            getItems();
        }
    }, [categoryDef, getItems]);

    // Reset UI when switching categories
    useEffect(() => {
        // Clear selected item
        setSelectedItem(null);

        // Clear sort/filter options
        setSortBy('rating');
        setSortAsc(false);
        setFilters({
            tags: [],
            rules: [],
        });
    }, [categoryId, prevCategoryId]);

    const rankedItems = useMemo(
        () => items.filter((item) => item.status === 'ranked'),
        [items],
    );
    const rankedItemsRef = useRef(rankedItems);
    rankedItemsRef.current = rankedItems;

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
    const handleSelectItem = (item: Item) => {
        setSelectedItem((prev) => (prev?.id === item.id ? null : item));
        setIsDetailViewOpen(true);
    };

    // Refresh list and start calibration
    const handleAddSuccess = useCallback(
        async (newStatus: Status, newItem: Item) => {
            setActiveTab(newStatus);
            const { data: updatedItems } = await getItems();

            // Perform calibration if new item is ranked
            if (newStatus === 'ranked' && updatedItems) {
                const freshItem = updatedItems.find((i) => i.id === newItem.id);
                if (freshItem && rankedItemsRef.current.length >= 1) {
                    setCalibrationItem(freshItem);
                    setIsComparisonModalOpen(true);
                }
            }
        },
        [getItems],
    );

    // Set new active tab, refresh edited item, and start calibration if moved to ranked
    const handleEditSuccess = useCallback(
        async (newStatus: Status, updatedItem: Item) => {
            const previousStatus = selectedItem?.status;
            setActiveTab(newStatus);
            await getItems();
            setSelectedItem(updatedItem); // Keep detail view in sync

            if (previousStatus === 'backlog' && newStatus === 'ranked') {
                setCalibrationItem(updatedItem);
                setIsComparisonModalOpen(true);
            }
        },
        [getItems, selectedItem?.status],
    );

    const handleCalibrationComplete = useCallback(() => {
        setCalibrationItem(null);
        setIsComparisonModalOpen(false);
        getItems();
    }, [getItems]);

    // Unselect item and refresh list
    const handleDeleteSuccess = () => {
        setSelectedItem(null);
        getItems();
    };

    // Refresh both the list and the item detail view
    // TODO: Is this still needed, or can it just be replaced by getItems()?
    const handleTagUpdateSuccess = async () => {
        const result = await getItems();
        if (result?.data && selectedItem) {
            const updatedItem = result.data.find(
                (item) => item.id === selectedItem.id,
            );
            setSelectedItem(updatedItem || null);
        }
    };

    const handleSortAndFilterApply = (
        newSortBy: string,
        newSortAsc: boolean,
        newFilters: AppliedFilters,
    ) => {
        setSortBy(newSortBy);
        setSortAsc(newSortAsc);
        setFilters(newFilters);
    };

    const handleRetry = () => {
        getItems();
    };

    return (
        <div className="relative h-full overflow-hidden lg:flex">
            {/* Left Column: Item List */}
            <div className="w-full h-full flex flex-col lg:w-1/2">
                <Tabs
                    value={activeTab}
                    className="flex flex-col h-full gap-0"
                    onValueChange={(value) => handleTabChange(value as Status)}
                >
                    {/* Left Side Header */}
                    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 m-4 mb-0 pb-4 border-b">
                        {/* Controls */}
                        <div className="flex flex-grow flex-wrap items-center justify-between gap-4">
                            {/* Status Tabs */}
                            <TabsList>
                                <TabsTrigger value="ranked">Ranked</TabsTrigger>
                                <TabsTrigger value="backlog">
                                    Backlog
                                </TabsTrigger>
                            </TabsList>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {defLoading ? (
                                    <>
                                        <Skeleton className="h-9 w-9" />
                                        <Skeleton className="h-9 w-9" />
                                        <Skeleton className="h-9 w-9" />
                                        <Skeleton className="h-9 w-9" />
                                    </>
                                ) : (
                                    <>
                                        {/* Sort Controls */}
                                        {categoryDef && (
                                            <SortControls
                                                categoryDef={categoryDef}
                                                sortBy={sortBy}
                                                sortAsc={sortAsc}
                                                isEloDisabled={
                                                    activeTab === 'backlog'
                                                }
                                                filters={filters}
                                                onSortApply={
                                                    handleSortAndFilterApply
                                                }
                                            />
                                        )}

                                        {/* Tag Management Modal */}
                                        {categoryDef && (
                                            <TagManager
                                                categoryDefId={categoryDef.id}
                                                onSuccess={
                                                    handleTagUpdateSuccess
                                                }
                                            />
                                        )}

                                        {/* Comparison Button */}
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

                                        {categoryDef && (
                                            <ComparisonModal
                                                rankedItems={
                                                    comparisonRankedItems
                                                }
                                                calibrationItem={
                                                    calibrationItem
                                                }
                                                open={isComparisonModalOpen}
                                                categoryDef={categoryDef}
                                                onOpenChange={
                                                    setIsComparisonModalOpen
                                                }
                                                onSuccess={getItems}
                                                onCalibrationComplete={
                                                    handleCalibrationComplete
                                                }
                                            />
                                        )}

                                        {/* Add Item Button */}
                                        {categoryDef && (
                                            <ItemForm
                                                mode="add"
                                                categoryDef={categoryDef}
                                                onSuccess={handleAddSuccess}
                                            />
                                        )}
                                    </>
                                )}

                                {/* Mobile Open Panel Toggle */}
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="lg:hidden"
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
                        {error ? (
                            <ErrorState onRetry={handleRetry} />
                        ) : (
                            <>
                                <TabsContent value="ranked">
                                    <ItemList
                                        items={rankedItems}
                                        loading={loading || defLoading}
                                        selectedItem={selectedItem}
                                        onSelectItem={handleSelectItem}
                                        emptyMessage="No ranked items found. Add your first item by pressing the plus button!"
                                        showPodium={
                                            sortBy === 'rating' && !sortAsc
                                        }
                                    />
                                </TabsContent>
                                <TabsContent value="backlog">
                                    <ItemList
                                        items={backlogItems}
                                        loading={loading || defLoading}
                                        selectedItem={selectedItem}
                                        onSelectItem={handleSelectItem}
                                        emptyMessage="No backlog items found. Add your first item by pressing the plus button!"
                                    />
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Overlay for mobile view */}
            {isDetailViewOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsDetailViewOpen(false)}
                />
            )}

            {/* Right Column: Detail View */}
            <div
                className={cn(
                    'overflow-y-auto absolute top-0 right-0 h-screen w-[85%] bg-background border-l transition-transform duration-300 ease-in-out z-30 lg:static lg:w-1/2 lg:h-auto lg:translate-x-0',
                    isDetailViewOpen ? 'translate-x-0' : 'translate-x-full',
                )}
            >
                {defLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">
                            Select an item to see details
                        </p>
                    </div>
                ) : (
                    <ItemDetailView
                        item={selectedItem}
                        categoryDef={categoryDef}
                        activeListStatus={activeTab}
                        onClose={() => setIsDetailViewOpen(false)}
                        onEdit={handleEditSuccess}
                        onDelete={handleDeleteSuccess}
                    />
                )}
            </div>
        </div>
    );
};

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
    <div className="flex items-center justify-center h-full text-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-sm p-8 border rounded-lg bg-card text-card-foreground shadow">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="text-xl font-semibold">Something went wrong</h3>
            <p className="text-muted-foreground">
                We couldn't load your items. Please check your internet
                connection and try again.
            </p>
            <Button onClick={onRetry}>Retry</Button>
        </div>
    </div>
);
