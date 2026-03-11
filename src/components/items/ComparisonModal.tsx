import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { cn } from '@/lib/utils';
import type { CategoryDefinition, Item } from '@/types/types';

import { ItemDetailsContent } from './ItemDetailsContent';

export interface ComparisonResult {
  winnerId: string;
  loserId: string;
  winnerName: string;
  loserName: string;
  winnerEloChange: number;
  loserEloChange: number;
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
 * Uses Elo rating logic (via Supabase RPC) to update rankings.
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
  const { items, currentPair, getNextPair, startNormalComparison, startCalibration, isCalibrating, updateRatings } =
    useComparisonQueue(rankedItems);

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [itemToView, setItemToView] = useState<Item | null>(null);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      onOpenChange(openState);
      if (!openState) {
        if (isCalibrating && onCalibrationComplete) {
          onCalibrationComplete();
        } else {
          onSuccess();
        }
      }
    },
    [onOpenChange, isCalibrating, onCalibrationComplete, onSuccess],
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

    // Re-fetch the two items to get their updated ratings
    const { data: updatedItems } = await supabase.from('items').select('id, rating').in('id', [winner.id, loser.id]);

    if (updatedItems) {
      const newWinner = updatedItems.find((i) => i.id === winner.id);
      const newLoser = updatedItems.find((i) => i.id === loser.id);

      if (newWinner && newLoser && winner.rating !== null && loser.rating !== null) {
        setResult({
          winnerId: winner.id,
          loserId: loser.id,
          winnerName: winner.name,
          loserName: loser.name,
          winnerEloChange: newWinner.rating! - winnerRatingBefore!,
          loserEloChange: newLoser.rating! - loserRatingBefore!,
        });

        updateRatings({ id: newWinner.id, rating: newWinner.rating! }, { id: newLoser.id, rating: newLoser.rating! });
      }
    }
    setIsLoading(false);
  };

  const handleNext = () => {
    setResult(null);
    getNextPair();
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
    }
  }, [open, startNormalComparison, startCalibration, calibrationItem]);

  // Automatically close the modal when the queue is empty
  useEffect(() => {
    if (hasStarted && !currentPair && !result) {
      handleOpenChange(false);
    }
  }, [currentPair, result, hasStarted, handleOpenChange]);

  const itemA = currentPair?.[0];
  const itemB = currentPair?.[1];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{result ? `${result.winnerName} wins!` : 'Which is better?'}</DialogTitle>
          <DialogDescription>
            {result
              ? "The Elo ratings have been updated. Click 'Next Matchup' to continue."
              : isCalibrating
                ? 'A few quick comparisons to place your new item. Click on an item to view its details.'
                : 'Select the item you prefer. Click on an item to view its details.'}
          </DialogDescription>
        </DialogHeader>

        <Sheet open={!!itemToView} onOpenChange={(isOpen) => !isOpen && setItemToView(null)}>
          <div className="grid grid-cols-2 gap-4 py-4">
            {currentPair && itemA && itemB && (
              <>
                {/* Left Item Card */}
                <ComparisonCard
                  item={itemA}
                  result={result}
                  isLoading={isLoading}
                  onView={() => setItemToView(itemA)}
                  onChoose={() => handleChoose(itemA, itemB)}
                />

                {/* Right Item Card */}
                <ComparisonCard
                  item={itemB}
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
            <Button variant="secondary" className="w-full" onClick={handleNext}>
              {isCalibrating && !currentPair ? 'Finishing...' : 'Next Matchup'}
            </Button>
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
  result: ComparisonResult | null;
  isLoading: boolean;
  onView: () => void;
  onChoose: () => void;
}

const ComparisonCard = ({ item, result, isLoading, onView, onChoose }: ComparisonCardProps) => {
  const isWinner = result?.winnerId === item.id;
  const isLoser = result?.loserId === item.id;
  const eloChange = isWinner ? result?.winnerEloChange : isLoser ? result?.loserEloChange : 0;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-lg border p-4 transition-colors',
        isWinner && 'border-green-500 bg-green-500/10',
        isLoser && 'border-red-500 bg-red-500/10',
      )}
    >
      <button
        onClick={onView}
        className="text-xl font-semibold text-center h-16 flex items-center hover:underline"
        disabled={!!result}
      >
        {item.name}
      </button>

      {!result ? (
        <Button className="w-full" onClick={onChoose} disabled={isLoading}>
          Choose
        </Button>
      ) : (
        <div className="h-10 flex items-center justify-center font-semibold">
          {eloChange !== undefined && (
            <p className={cn(eloChange > 0 ? 'text-green-500' : 'text-red-500')}>
              Elo: {eloChange > 0 ? `+${eloChange}` : eloChange}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
