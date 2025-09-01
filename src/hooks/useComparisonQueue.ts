import { useCallback, useEffect, useRef, useState } from 'react';

import { type CombinedItem } from '@/types/types';

// Type for a pair of items to be compared
export type ItemPair = [CombinedItem, CombinedItem];

// Efficiently shuffles an array using the Fisher-Yates shuffle
const shuffle = <T>(array: T[]): T[] => {
    const newArray = [...array];

    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    return newArray;
};

export const useComparisonQueue = (initialItems: CombinedItem[]) => {
    const [items, setItems] = useState<CombinedItem[]>(initialItems); // Holds the list as it's modifiued by `updateRatings`

    const prevInitialItemsRef = useRef(initialItems); // Tracks the `initialItems` prop from the previous render

    // Check if the props have changed this render
    // This is `true` when a new session begins
    const initialItemsHaveChanged =
        prevInitialItemsRef.current !== initialItems;

    // Determine the correct list to use for this render cycle
    // If the prop changed, use the new prop. Otherwise, use our internal state (which might have updates).
    const currentList = initialItemsHaveChanged ? initialItems : items;

    // Ref used by our stable callbacks. An always correct list
    // Updated directly during the render
    const itemsRef = useRef(currentList);
    itemsRef.current = currentList;

    // Schedule an effect to update our internal state and the tracking ref for the next render
    useEffect(() => {
        if (initialItemsHaveChanged) {
            setItems(initialItems);
            prevInitialItemsRef.current = initialItems;
        }
    }, [initialItems, initialItemsHaveChanged]);

    const [currentPair, setCurrentPair] = useState<ItemPair | null>(null);
    const [, setComparisonQueue] = useState<ItemPair[]>([]);
    const [isCalibrating, setIsCalibrating] = useState(false);

    const updateRatings = useCallback(
        (
            updatedItem1: { id: string; rating: number },
            updatedItem2: { id: string; rating: number },
        ) => {
            setItems((currentItems) =>
                currentItems.map((item) => {
                    if (item.id === updatedItem1.id) {
                        return { ...item, rating: updatedItem1.rating };
                    }
                    if (item.id === updatedItem2.id) {
                        return { ...item, rating: updatedItem2.rating };
                    }
                    return item;
                }),
            );
        },
        [],
    );

    // Generate mixed queue of random and similar pairs for comparison
    const startNormalComparison = useCallback(() => {
        console.group('[startNormalComparison] Generate queue for comparisons');

        setIsCalibrating(false);

        const currentItems = itemsRef.current;
        console.log({ currentItems: currentItems });

        if (currentItems.length < 2) {
            console.log('currentItems too small for comparisons, ending.');
            console.groupEnd();

            setComparisonQueue([]);
            setCurrentPair(null);
            return;
        }

        // Within 200 elo or 2 positions
        const similarPairs: ItemPair[] = [];
        for (let i = 0; i < currentItems.length; i++) {
            const itemA = currentItems[i];
            for (let j = i + 1; j < currentItems.length; j++) {
                const itemB = currentItems[j];

                const indexDifference = j - i;
                const ratingDifference =
                    itemA.rating !== null && itemB.rating !== null
                        ? itemA.rating - itemB.rating
                        : Infinity;

                // Break early if impossible for any future matches
                if (indexDifference > 2 && ratingDifference > 200) {
                    break;
                }

                similarPairs.push([itemA, itemB]);
            }
        }
        console.log(`Generated ${similarPairs.length} similar pairs`);

        const maxPossiblePairs =
            (currentItems.length * (currentItems.length - 1)) / 2;
        console.log('Maximum possible pairs:', maxPossiblePairs);

        const targetQueueSize = Math.min(100, maxPossiblePairs);
        const numSimilar = Math.min(similarPairs.length, 85);
        const numRandom = targetQueueSize - numSimilar;
        console.log(`Pair split: ${numSimilar} similar, ${numRandom} random`);

        const similarSubset = shuffle(similarPairs).slice(0, numSimilar);
        console.log('Similar pairs:', similarSubset);

        const similarPairIds = new Set<string>(
            similarSubset.map((pair) =>
                [pair[0].id, pair[1].id].sort().join('-'),
            ),
        );

        let randomSubset: ItemPair[] = [];

        if (numRandom > 0) {
            const availableRandomPairs = maxPossiblePairs - similarPairIds.size;
            console.log(
                `Generating ${numRandom} random pairs from ${availableRandomPairs} available random pairs.`,
            );

            if (numRandom > availableRandomPairs / 4) {
                // Shuffle and slice (for dense selection)
                console.log('Generating using shuffle and slice method');
                const randomPool: ItemPair[] = [];
                for (let i = 0; i < currentItems.length; i++) {
                    for (let j = i + 1; j < currentItems.length; j++) {
                        const itemA = currentItems[i];
                        const itemB = currentItems[j];
                        const pairId = [itemA.id, itemB.id].sort().join('-');
                        if (!similarPairIds.has(pairId)) {
                            randomPool.push([itemA, itemB]);
                        }
                    }
                }
                randomSubset = shuffle(randomPool).slice(0, numRandom);
            } else {
                // Rejection sampling (for sparse selections)
                console.log('Generating using rejection sampling method');
                const addedPairIds = new Set<string>(similarPairIds);
                const listSize = currentItems.length;

                while (randomSubset.length < numRandom) {
                    const i = Math.floor(Math.random() * listSize);
                    let j = Math.floor(Math.random() * listSize);
                    if (i === j) j = (j + 1) % listSize;

                    const itemA = currentItems[i];
                    const itemB = currentItems[j];
                    const pairId = [itemA.id, itemB.id].sort().join('-');

                    if (!addedPairIds.has(pairId)) {
                        addedPairIds.add(pairId);
                        randomSubset.push([itemA, itemB]);
                    }
                }
            }

            console.log('Random pairs:', randomSubset);
        }

        const finalQueue = shuffle([...similarSubset, ...randomSubset]);
        console.log('Final queue:', finalQueue);

        setComparisonQueue(finalQueue);
        setCurrentPair(finalQueue[0] || null);

        console.groupEnd();
    }, []);

    // Generate and start a calibration queue
    const startCalibration = useCallback((newItem: CombinedItem) => {
        console.group('[startCalibration] Generate queue for calibration');
        setIsCalibrating(true);
        const currentItems = itemsRef.current;
        console.log({ newItem: newItem, currentItems: currentItems });

        const itemInList = currentItems.find((item) => item.id === newItem.id);
        if (!itemInList) {
            console.error('newItem was not found in the main items list.');
            console.groupEnd();
            return;
        }

        const otherItems = currentItems.filter(
            (item) => item.id !== newItem.id,
        );
        console.log({ otherItems: otherItems });
        if (otherItems.length === 0) {
            console.log('No other items to compare against. Ending.');
            console.groupEnd();

            setComparisonQueue([]);
            setCurrentPair(null);
            return;
        }

        // Compare against the median, top 25%, and bottom 25%
        const queue: ItemPair[] = [];
        const midIndex = Math.floor(otherItems.length / 2);
        const topQuartileIndex = Math.floor(otherItems.length * 0.25);
        const bottomQuartileIndex = Math.floor(otherItems.length * 0.75);

        // Add unique items to the queue
        const indices = [
            ...new Set([midIndex, topQuartileIndex, bottomQuartileIndex]),
        ];
        console.log('Calculated indices to check:', indices);

        indices.forEach((index) => {
            console.log(`Checking index ${index}:`, otherItems[index]);
            if (otherItems[index]) {
                queue.push([itemInList, otherItems[index]]);
            }
        });

        console.log('Final queue being set:', queue);
        console.groupEnd();

        setComparisonQueue(queue);
        setCurrentPair(queue[0] || null);
    }, []);

    const getNextPair = useCallback(() => {
        setComparisonQueue((prevQueue) => {
            const newQueue = prevQueue.slice(1);
            setCurrentPair(newQueue[0] || null);
            return newQueue;
        });
    }, []);

    return {
        items,
        currentPair,
        getNextPair,
        startNormalComparison,
        startCalibration,
        isCalibrating,
        updateRatings,
    };
};
