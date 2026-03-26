import { AlertTriangle, PanelRightOpen, Swords } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCategoryItems } from '@/hooks/useCategoryItems';
import { usePrevious } from '@/hooks/usePrevious';
import { cn } from '@/lib/utils';
import type { AppliedFilters, CategoryDefinition, Item, Status } from '@/types/types';

import { ComparisonModal } from '../items/ComparisonModal';
import { ItemDetailView } from '../items/ItemDetailView';
import { ItemForm } from '../items/ItemForm';
import { ItemList } from '../items/ItemList';
import { SortControls } from '../items/SortControls';
import { TagManager } from './TagManager';

/**
 * Primary dashboard for a specific category, managing the split-pane view
 * between the item list (ranked/backlog) and the item detail panel.
 *
 * Side Effects:
 * - Fetches items from Supabase on mount and when filters/sorting change.
 */
export const CategoryView = ({ categoryDef }: { categoryDef: CategoryDefinition }) => {
  const { user } = useAuth();

  const {
    items,
    loading,
    error,
    rankedItems,
    backlogItems,
    comparisonRankedItems,
    sortBy,
    setSortBy,
    sortAsc,
    setSortAsc,
    filters,
    setFilters,
    getItems,
  } = useCategoryItems(categoryDef, user);

  const [activeTab, setActiveTab] = useState<Status>('ranked');

  // - Handle DetailView -
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = useMemo(() => items.find((i) => i.id === selectedItemId) || null, [items, selectedItemId]);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // Handle ComparisonModal
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [calibrationItem, setCalibrationItem] = useState<Item | null>(null);

  const prevCategoryId = usePrevious(categoryDef.id);

  // Clear selected item when switching to a different category.
  // Uses the same same-ID guard as useCategoryItems to avoid clearing the
  // selection when the user edits the current category's schema.
  useEffect(() => {
    if (prevCategoryId !== undefined && prevCategoryId === categoryDef.id) return;
    setSelectedItemId(null);
  }, [categoryDef.id, prevCategoryId]);

  // Unselect item and set new active tab for form
  const handleTabChange = (value: Status) => {
    setSelectedItemId(null);
    setActiveTab(value);

    // Set default sorting based on selected tab
    if (value === 'backlog') {
      setSortBy('name'); // Alphabetical
      setSortAsc(true);
    } else {
      // ranked
      setSortBy('rating'); // Rating
      setSortAsc(false);
    }
  };

  // Toggle selection of item
  const handleSelectItem = useCallback((item: Item) => {
    setSelectedItemId((prev) => (prev === item.id ? null : item.id));
    setIsDetailViewOpen(true);
  }, []);

  // Refresh list and start calibration
  const handleAddSuccess = useCallback(
    async (newStatus: Status, newItem: Item) => {
      setActiveTab(newStatus);
      const { data: updatedItems } = await getItems();

      // Perform calibration if new item is ranked
      if (newStatus === 'ranked' && updatedItems) {
        const freshItem = updatedItems.find((i) => i.id === newItem.id);
        const rankedCount = updatedItems.filter((i) => i.status === 'ranked').length;

        if (!freshItem && rankedCount > 1) {
          // Item exists but doesn't match active filters — calibration can't run
          toast.info('Calibration skipped', {
            description: 'The new item doesn\u2019t match the current filters. Remove filters to calibrate it.',
          });
        } else if (freshItem && rankedCount > 1) {
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
  const handleDeleteSuccess = useCallback(() => {
    setSelectedItemId(null);
    getItems();
  }, [getItems]);

  // Refresh both the list and the item detail view
  const handleTagUpdateSuccess = useCallback(() => {
    getItems();
  }, [getItems]);

  const handleSortAndFilterApply = useCallback(
    (newSortBy: string, newSortAsc: boolean, newFilters: AppliedFilters) => {
      setSortBy(newSortBy);
      setSortAsc(newSortAsc);
      setFilters(newFilters);
    },
    [setSortBy, setSortAsc, setFilters],
  );

  const handleRetry = useCallback(() => {
    getItems();
  }, [getItems]);

  // Compute category average rating so new items start near the cluster instead of hardcoded 1000
  const averageRating = useMemo(() => {
    const rated = comparisonRankedItems.filter((i) => i.rating !== null);
    if (rated.length === 0) return 1000;
    return Math.round(rated.reduce((sum, i) => sum + i.rating!, 0) / rated.length);
  }, [comparisonRankedItems]);

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
          <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:gap-x-6 sm:gap-y-4 mx-3 sm:mx-4 mt-3 sm:mt-4 mb-0 pb-3 sm:pb-4 border-b">
            {/* Controls */}
            <div className="flex flex-grow flex-wrap items-center justify-between gap-1.5 sm:gap-2 md:gap-4">
              {/* Status Tabs */}
              <TabsList>
                <TabsTrigger value="ranked">Ranked</TabsTrigger>
                <TabsTrigger value="backlog">Backlog</TabsTrigger>
              </TabsList>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Sort Controls */}
                <SortControls
                  categoryDef={categoryDef}
                  items={items}
                  sortBy={sortBy}
                  sortAsc={sortAsc}
                  isRatingDisabled={activeTab === 'backlog'}
                  filters={filters}
                  onSortApply={handleSortAndFilterApply}
                />

                {/* Tag Management Modal */}
                <TagManager categoryDefId={categoryDef.id} onSuccess={handleTagUpdateSuccess} />

                {/* Comparison Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Clear any leftover calibration item from a previous session
                    setCalibrationItem(null);
                    setIsComparisonModalOpen(true);
                  }}
                  disabled={activeTab === 'backlog' || rankedItems.length < 2}
                >
                  <Swords className="h-4 w-4" />
                  <span className="sr-only">Compare Items</span>
                </Button>

                <ComparisonModal
                  rankedItems={comparisonRankedItems}
                  calibrationItem={calibrationItem}
                  open={isComparisonModalOpen}
                  categoryDef={categoryDef}
                  onOpenChange={setIsComparisonModalOpen}
                  onSuccess={getItems}
                  onCalibrationComplete={handleCalibrationComplete}
                />

                {/* Add Item Button */}
                <ItemForm
                  mode="add"
                  categoryDef={categoryDef}
                  defaultStatus={activeTab}
                  defaultRating={averageRating}
                  onSuccess={handleAddSuccess}
                />

                {/* Mobile Open Panel Toggle */}
                <Button
                  size="icon"
                  variant="outline"
                  className="lg:hidden"
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
          <div className="flex-1 p-3 pt-4 sm:p-4 sm:pt-6 overflow-y-auto" onClick={() => setSelectedItemId(null)}>
            {error ? (
              <ErrorState onRetry={handleRetry} />
            ) : (
              <>
                <TabsContent value="ranked">
                  <ItemList
                    items={rankedItems}
                    fieldDefinitions={categoryDef.field_definitions}
                    loading={loading}
                    selectedItem={selectedItem}
                    onSelectItem={handleSelectItem}
                    emptyMessage="No ranked items found. Add your first item by pressing the plus button!"
                    showPodium={sortBy === 'rating' && !sortAsc}
                  />
                </TabsContent>
                <TabsContent value="backlog">
                  <ItemList
                    items={backlogItems}
                    fieldDefinitions={categoryDef.field_definitions}
                    loading={loading}
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
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsDetailViewOpen(false)} />
      )}

      {/* Right Column: Detail View */}
      <div
        className={cn(
          'overflow-y-auto absolute top-0 right-0 h-full w-[85%] bg-background border-l transition-transform duration-300 ease-in-out z-30 lg:static lg:w-1/2 lg:h-auto lg:translate-x-0',
          isDetailViewOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <ItemDetailView
          item={selectedItem}
          categoryDef={categoryDef}
          onClose={() => setIsDetailViewOpen(false)}
          onEdit={handleEditSuccess}
          onDelete={handleDeleteSuccess}
        />
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
        We couldn't load your items. Please check your internet connection and try again.
      </p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  </div>
);
