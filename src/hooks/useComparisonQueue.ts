import { useState, useMemo, useCallback } from 'react';
import { type CombinedItem } from '@/types/types';

// Type for a pair of items to be compared
export type ItemPair = [CombinedItem, CombinedItem];

export const useComparisonQueue = (rankedItems: CombinedItem[]) => {
    // State to hold the current pair of items being compared
    const [currentPair, setCurrentPair] = useState<ItemPair | null>(null);

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

    // Function to get the next pair of items to compare
    const getNextPair = useCallback(() => {
        if (allPossiblePairs.length === 0) {
            setCurrentPair(null);
            return;
        }

        const shouldUseSimilar =
            Math.random() < 0.85 && similarRankPairs.length > 0;

        let selectedPair: ItemPair;

        if (shouldUseSimilar) {
            // 85% chance to pick a pair with a similar rating
            const randomIndex = Math.floor(
                Math.random() * similarRankPairs.length,
            );
            selectedPair = similarRankPairs[randomIndex];
        } else {
            // 15% chance to pick any random pair
            const randomIndex = Math.floor(
                Math.random() * allPossiblePairs.length,
            );
            selectedPair = allPossiblePairs[randomIndex];
        }

        // Randomize the order of the pair (left vs. right)
        setCurrentPair(
            Math.random() < 0.5
                ? selectedPair
                : [selectedPair[1], selectedPair[0]],
        );
    }, [allPossiblePairs, similarRankPairs]);

    return {
        currentPair,
        getNextPair,
    };
};
