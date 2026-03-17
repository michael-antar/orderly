import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { TagBadge } from '@/components/categories/TagBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useComparisonQueue } from '@/hooks/useComparisonQueue';
import { supabase } from '@/lib/supabaseClient';
import { cn, getCategoryDetails } from '@/lib/utils';
import type { CategoryDefinition, FieldDefinition, Item } from '@/types/types';

import { ItemDetailsContent } from './ItemDetailsContent';

export interface ComparisonResult {
  winnerId: string;
  loserId: string;
  winnerName: string;
  loserName: string;
  winnerRatingChange: number;
  loserRatingChange: number;
}

export interface ComparisonModalProps {
  rankedItems: Item[];
  /** If included, puts this item in "Calibration Mode  " */
  calibrationItem?: Item | null;
  open: boolean;
  categoryDef: CategoryDefinition;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  onCalibrationComplete?: () => void;
}

/**
 * Modal for head-to-head item comparisons.
 * Supports both standard random matching and targeted calibration for new items.
 * Uses Glicko-1 rating logic (via Supabase RPC) to update rankings.
 */
export const ComparisonModal = ({
  rankedItems,
  calibrationItem,
  open,
  categoryDef,
  onOpenChange,
  onSuccess,
  onCalibrationComplete,
}: ComparisonModalProps) => {
  const {
    items,
    currentPair,
    getNextPair,
    startNormalComparison,
    startCalibration,
    advanceCalibration,
    isCalibrating,
    calibrationMaxRounds,
    updateRatings,
  } = useComparisonQueue(rankedItems);

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [itemToView, setItemToView] = useState<Item | null>(null);
  // Tracks the pair currently shown on screen, surviving after currentPair goes null
  const [displayedPair, setDisplayedPair] = useState<[Item, Item] | null>(null);
  // Track the number of completed calibration rounds (advances on "Next Matchup", not on "Choose")
  const [completedCalibrationRounds, setCompletedCalibrationRounds] = useState(0);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        // Reset started state so auto-close doesn't fire prematurely on next open
        setHasStarted(false);
        // Use the `calibrationItem` prop (stable for the session lifetime) rather
        // than the `isCalibrating` state, which is set to false *before* the
        // auto-close effect fires when calibration finishes naturally.
        if (calibrationItem && onCalibrationComplete) {
          onCalibrationComplete();
        } else {
          onSuccess();
        }
      }
      onOpenChange(openState);
    },
    [onOpenChange, calibrationItem, onCalibrationComplete, onSuccess],
  );

  const handleChoose = async (winner: Item, loser: Item) => {
    setIsLoading(true);

    const currentWinner = items.find((i) => i.id === winner.id);
    const currentLoser = items.find((i) => i.id === loser.id);

    // Original ratings before comparison
    const winnerRatingBefore = currentWinner?.rating;
    const loserRatingBefore = currentLoser?.rating;

    const { error } = await supabase.rpc('handle_comparison', {
      p_winner_id: winner.id,
      p_loser_id: loser.id,
    });

    if (error) {
      toast.error('Comparison failed', {
        description: 'There was a problem saving the result.',
      });
      setIsLoading(false);
      return;
    }

    // Re-fetch the two items to get their updated ratings and RD
    const { data: updatedItems } = await supabase
      .from('items')
      .select('id, rating, rd')
      .in('id', [winner.id, loser.id]);

    if (updatedItems) {
      const newWinner = updatedItems.find((i) => i.id === winner.id);
      const newLoser = updatedItems.find((i) => i.id === loser.id);

      if (newWinner && newLoser && winnerRatingBefore != null && loserRatingBefore != null) {
        setResult({
          winnerId: winner.id,
          loserId: loser.id,
          winnerName: winner.name,
          loserName: loser.name,
          winnerRatingChange: newWinner.rating! - winnerRatingBefore,
          loserRatingChange: newLoser.rating! - loserRatingBefore,
        });

        updateRatings(
          { id: newWinner.id, rating: newWinner.rating!, rd: newWinner.rd },
          { id: newLoser.id, rating: newLoser.rating!, rd: newLoser.rd },
        );
      }
    }
    setIsLoading(false);
  };

  const handleNext = () => {
    if (isCalibrating) {
      // Advance calibration now (on "Next Matchup" press, not on choose)
      advanceCalibration(result!.winnerId);
      setCompletedCalibrationRounds((prev) => prev + 1);
    } else {
      getNextPair();
    }
    setResult(null);
  };

  // Get the first pair when the modal opens
  useEffect(() => {
    if (open) {
      if (calibrationItem) {
        startCalibration(calibrationItem);
      } else {
        startNormalComparison();
      }
      setResult(null);
      setHasStarted(true);
      setCompletedCalibrationRounds(0);
      setDisplayedPair(null);
    }
  }, [open, startNormalComparison, startCalibration, calibrationItem]);

  // Keep displayedPair in sync with currentPair (but don't clear it when currentPair becomes null)
  useEffect(() => {
    if (currentPair) {
      setDisplayedPair(currentPair);
    }
  }, [currentPair]);

  // Automatically close the modal when the queue is empty (and no result is being displayed)
  useEffect(() => {
    if (hasStarted && !currentPair && !result) {
      handleOpenChange(false);
    }
  }, [currentPair, result, hasStarted, handleOpenChange]);

  const itemA = displayedPair?.[0];
  const itemB = displayedPair?.[1];

  // Determine if this is the last calibration round (result shown but no next pair)
  const isLastCalibrationResult = !!(result && isCalibrating && completedCalibrationRounds + 1 >= calibrationMaxRounds);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isLastCalibrationResult
              ? 'Calibration complete!'
              : result
                ? `${result.winnerName} wins!`
                : 'Which is better?'}
          </DialogTitle>
          <DialogDescription>
            {isLastCalibrationResult
              ? 'Your new item has been placed in the ranking.'
              : result
                ? "The ratings have been updated. Click 'Next Matchup' to continue."
                : isCalibrating
                  ? `Calibration round ${completedCalibrationRounds + 1} of ${calibrationMaxRounds} — placing your new item.`
                  : 'Select the item you prefer. Click on an item to view its details.'}
          </DialogDescription>
          {calibrationMaxRounds > 0 && isCalibrating && (
            <div className="flex gap-1.5 pt-2">
              {Array.from({ length: calibrationMaxRounds }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i < completedCalibrationRounds
                      ? 'bg-primary'
                      : i === completedCalibrationRounds && result
                        ? isLastCalibrationResult
                          ? 'bg-primary'
                          : 'bg-muted-foreground/40'
                        : 'bg-muted',
                  )}
                />
              ))}
            </div>
          )}
        </DialogHeader>

        <Sheet open={!!itemToView} onOpenChange={(isOpen) => !isOpen && setItemToView(null)}>
          <div className="grid grid-cols-2 gap-4 py-4">
            {displayedPair && itemA && itemB && (
              <>
                {/* Left Item Card */}
                <ComparisonCard
                  item={itemA}
                  fieldDefinitions={categoryDef.field_definitions}
                  result={result}
                  isLoading={isLoading}
                  onView={() => setItemToView(itemA)}
                  onChoose={() => handleChoose(itemA, itemB)}
                />

                {/* Right Item Card */}
                <ComparisonCard
                  item={itemB}
                  fieldDefinitions={categoryDef.field_definitions}
                  result={result}
                  isLoading={isLoading}
                  onView={() => setItemToView(itemB)}
                  onChoose={() => handleChoose(itemB, itemA)}
                />
              </>
            )}
          </div>

          <SheetContent side="bottom" className="h-2/3 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Item Details</SheetTitle>
              <SheetDescription>Detailed information for the selected item.</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              {itemToView && <ItemDetailsContent item={itemToView} categoryDef={categoryDef} />}
            </div>
          </SheetContent>
        </Sheet>

        <Separator />

        <DialogFooter>
          {result ? (
            isLastCalibrationResult ? (
              <Button variant="secondary" className="w-full" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            ) : (
              <Button variant="secondary" className="w-full" onClick={handleNext}>
                Next Matchup
              </Button>
            )
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export interface ComparisonCardProps {
  item: Item;
  fieldDefinitions: FieldDefinition[];
  result: ComparisonResult | null;
  isLoading: boolean;
  onView: () => void;
  onChoose: () => void;
}

const ComparisonCard = ({ item, fieldDefinitions, result, isLoading, onView, onChoose }: ComparisonCardProps) => {
  const isWinner = result?.winnerId === item.id;
  const isLoser = result?.loserId === item.id;
  const ratingChange = isWinner ? result?.winnerRatingChange : isLoser ? result?.loserRatingChange : 0;

  const detailsString = getCategoryDetails(item, fieldDefinitions)
    .map((detail) => detail[1])
    .join(', ');

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border p-4 transition-all duration-300',
        isWinner && 'border-green-500 bg-green-500/10 scale-[1.02] shadow-md shadow-primary/20',
        isLoser && 'border-red-500 bg-red-500/10 scale-[0.98] opacity-70',
        !result && !isLoading && 'hover:border-primary/50 cursor-pointer',
      )}
      onClick={!result && !isLoading ? onChoose : undefined}
    >
      {/* Item name — clickable to view details */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
        className="text-lg font-semibold text-center min-h-[3rem] flex items-center justify-center hover:underline"
      >
        {item.name}
      </button>

      {/* Item details summary */}
      {detailsString && <p className="text-xs text-muted-foreground text-center truncate mt-1">{detailsString}</p>}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {item.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
          {item.tags.length > 3 && <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>}
        </div>
      )}

      {/* Choose button or result */}
      <div className="mt-auto pt-3">
        {!result ? (
          <Button
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onChoose();
            }}
            disabled={isLoading}
          >
            Choose
          </Button>
        ) : (
          <div className="h-10 flex items-center justify-center font-semibold">
            {ratingChange !== undefined && (
              <p
                className={cn(
                  'transition-all duration-300',
                  ratingChange > 0 ? 'text-green-500' : ratingChange < 0 ? 'text-red-500' : 'text-muted-foreground',
                )}
              >
                {ratingChange > 0 ? `+${Math.round(ratingChange)}` : Math.round(ratingChange)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
