import { useState, useMemo, useCallback } from 'react';
import { type CombinedItem } from '@/types/types';

// Type for a pair of items to be compared
export type ItemPair = [CombinedItem, CombinedItem];

export const useComparisonQueue = (rankedItems: CombinedItem[]) => {
    const [currentPair, setCurrentPair] = useState<ItemPair | null>(null);
    const [comparisonQueue, setComparisonQueue] = useState<ItemPair[]>([]); // Manage queue of matchups for calibration

    // Memoized list of all possible pairs that have a "similar" rating
    const similarRankPairs = useMemo(() => {
        const pairs: ItemPair[] = [];
        if (rankedItems.length < 2) return [];

        for (let i = 0; i < rankedItems.length; i++) {
            for (let j = i + 1; j < rankedItems.length; j++) {
                const itemA = rankedItems[i];
                const itemB = rankedItems[j];
                // Ensure both items have a rating
                if (itemA.rating !== null && itemB.rating !== null) {
                    if (Math.abs(itemA.rating - itemB.rating) <= 200) {
                        pairs.push([itemA, itemB]);
                    }
                }
            }
        }
        return pairs;
    }, [rankedItems]);

    // Memoized list of all possible random pairs
    const allPossiblePairs = useMemo(() => {
        const pairs: ItemPair[] = [];
        if (rankedItems.length < 2) return [];

        for (let i = 0; i < rankedItems.length; i++) {
            for (let j = i + 1; j < rankedItems.length; j++) {
                pairs.push([rankedItems[i], rankedItems[j]]);
            }
        }
        return pairs;
    }, [rankedItems]);

    // Generate and start a calibration queue
    const startCalibration = useCallback(
        (newItem: CombinedItem) => {
            const itemInList = rankedItems.find(
                (item) => item.id === newItem.id,
            );
            if (!itemInList) return; // Should not happen if getItems() was called

            const otherItems = rankedItems.filter(
                (item) => item.id !== newItem.id,
            );
            if (otherItems.length === 0) return;

            // Compare against the median, top 25%, and bottom 25%
            const queue: ItemPair[] = [];
            const midIndex = Math.floor(otherItems.length / 2);
            const topQuartileIndex = Math.floor(otherItems.length * 0.25);
            const bottomQuartileIndex = Math.floor(otherItems.length * 0.75);

            // Add unique items to the queue
            const indices = [
                ...new Set([midIndex, topQuartileIndex, bottomQuartileIndex]),
            ];
            indices.forEach((index) => {
                if (otherItems[index]) {
                    queue.push([newItem, otherItems[index]]);
                }
            });

            setComparisonQueue(queue);
            setCurrentPair(queue[0] || null);
        },
        [rankedItems],
    );

    const getNextPair = useCallback(() => {
        setComparisonQueue((currentQueue) => {
            // Handle the calibration queue first
            if (currentQueue.length > 0) {
                const newQueue = currentQueue.slice(1);
                setCurrentPair(newQueue[0] || null);
                return newQueue;
            }

            // If the queue is empty, fall back to normal comparison logic
            if (allPossiblePairs.length === 0) {
                setCurrentPair(null);
                return [];
            }

            const shouldUseSimilar =
                Math.random() < 0.85 && similarRankPairs.length > 0;

            let selectedPair: ItemPair;

            if (shouldUseSimilar) {
                const randomIndex = Math.floor(
                    Math.random() * similarRankPairs.length,
                );
                selectedPair = similarRankPairs[randomIndex];
            } else {
                const randomIndex = Math.floor(
                    Math.random() * allPossiblePairs.length,
                );
                selectedPair = allPossiblePairs[randomIndex];
            }

            setCurrentPair(
                Math.random() < 0.5
                    ? selectedPair
                    : [selectedPair[1], selectedPair[0]],
            );

            // The queue is and should remain empty in this case
            return [];
        });
    }, [allPossiblePairs, similarRankPairs]); // Now it only depends on stable, memoized values

    return {
        currentPair,
        getNextPair,
        startCalibration,
        isCalibrating: comparisonQueue.length > 0,
    };
};
