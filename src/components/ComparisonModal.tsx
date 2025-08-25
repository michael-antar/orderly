import { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from './ui/separator';

import { useComparisonQueue } from '@/hooks/useComparisonQueue';

import { type CombinedItem } from '@/types/types';
type Result = {
    winnerName: string;
    loserName: string;
    winnerEloChange: number;
    loserEloChange: number;
};

type ComparisonModalProps = {
    children: React.ReactNode;
    rankedItems: CombinedItem[];
    onSuccess: () => void;
};

export const ComparisonModal = ({
    children,
    rankedItems,
    onSuccess,
}: ComparisonModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { currentPair, getNextPair } = useComparisonQueue(rankedItems);
    const [result, setResult] = useState<Result | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get the first pair when the modal opens
    useEffect(() => {
        if (isOpen) {
            getNextPair();
            setResult(null);
        }
    }, [isOpen, getNextPair]);

    const handleChoose = async (winner: CombinedItem, loser: CombinedItem) => {
        setIsLoading(true);
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
        const { data: updatedItems } = await supabase
            .from('items')
            .select('id, rating')
            .in('id', [winner.id, loser.id]);

        if (updatedItems) {
            const newWinner = updatedItems.find((i) => i.id === winner.id);
            const newLoser = updatedItems.find((i) => i.id === loser.id);

            if (
                newWinner &&
                newLoser &&
                winner.rating !== null &&
                loser.rating !== null
            ) {
                setResult({
                    winnerName: winner.name,
                    loserName: loser.name,
                    winnerEloChange: newWinner.rating! - winner.rating,
                    loserEloChange: newLoser.rating! - loser.rating,
                });
            }
        }
        setIsLoading(false);
    };

    const handleNext = () => {
        setResult(null);
        getNextPair();
    };

    const handleClose = (openState: boolean) => {
        setIsOpen(openState);
        if (!openState) {
            onSuccess(); // Refresh the main list when the dialog closes
        }
    };

    const itemA = currentPair?.[0];
    const itemB = currentPair?.[1];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Which is better?</DialogTitle>
                    <DialogDescription>
                        Select the item you prefer. Click an item's name to see
                        more details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {!currentPair && !result && (
                        <p className="col-span-2 text-center text-muted-foreground">
                            No more pairs to compare!
                        </p>
                    )}
                    {currentPair && !result && (
                        <>
                            {/* Left Item */}
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-xl font-semibold text-center h-16 flex items-center">
                                    {itemA?.name}
                                </h3>
                                <Button
                                    className="w-full"
                                    onClick={() => handleChoose(itemA!, itemB!)}
                                    disabled={isLoading}
                                >
                                    Choose
                                </Button>
                            </div>

                            {/* Right Item */}
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-xl font-semibold text-center h-16 flex items-center">
                                    {itemB?.name}
                                </h3>
                                <Button
                                    className="w-full"
                                    onClick={() => handleChoose(itemB!, itemA!)}
                                    disabled={isLoading}
                                >
                                    Choose
                                </Button>
                            </div>
                        </>
                    )}
                    {result && (
                        <div className="col-span-2 flex flex-col items-center gap-2 text-center">
                            <p>
                                <span className="font-bold">
                                    {result.winnerName}
                                </span>{' '}
                                won!
                            </p>
                            <p
                                className={cn(
                                    'font-semibold',
                                    result.winnerEloChange > 0
                                        ? 'text-green-500'
                                        : 'text-red-500',
                                )}
                            >
                                Elo:{' '}
                                {result.winnerEloChange > 0
                                    ? `+${result.winnerEloChange}`
                                    : result.winnerEloChange}
                            </p>
                            <p
                                className={cn(
                                    'font-semibold',
                                    result.loserEloChange > 0
                                        ? 'text-green-500'
                                        : 'text-red-500',
                                )}
                            >
                                {result.loserName} Elo:{' '}
                                {result.loserEloChange > 0
                                    ? `+${result.loserEloChange}`
                                    : result.loserEloChange}
                            </p>
                        </div>
                    )}
                </div>

                <Separator />

                <DialogFooter>
                    {result ? (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleNext}
                        >
                            Next Matchup
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => handleClose(false)}
                        >
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
