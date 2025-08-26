import { useCallback, useEffect, useRef, useState } from 'react';

import { type CombinedItem } from '@/types/types';

// Type for a pair of items to be compared
export type ItemPair = [CombinedItem, CombinedItem];

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
        console.log('--- startNormalCalibration Fired ---');
        const currentItems = itemsRef.current;
        console.log('Hook is using this `items` array:', currentItems);

        setIsCalibrating(false);

        const similarPairs: ItemPair[] = [];
        for (let i = 0; i < currentItems.length; i++) {
            for (let j = i + 1; j < currentItems.length; j++) {
                const itemA = currentItems[i];
                const itemB = currentItems[j];
                if (itemA.rating !== null && itemB.rating !== null) {
                    if (Math.abs(itemA.rating - itemB.rating) <= 200) {
                        similarPairs.push([itemA, itemB]);
                    }
                }
            }
        }

        const randomPairs: ItemPair[] = [];
        for (let i = 0; i < currentItems.length; i++) {
            for (let j = i + 1; j < currentItems.length; j++) {
                randomPairs.push([currentItems[i], currentItems[j]]);
            }
        }

        const queueSize = (currentItems.length * (currentItems.length - 1)) / 2;
        console.log(
            `Max queue size of: ${queueSize}\n`,
            `\tMax Similar: ${similarPairs.length}`,
            `\tMax Random: ${randomPairs.length}`,
        );
        if (queueSize === 0) {
            setComparisonQueue([]);
            setCurrentPair(null);
            return;
        }

        const numSimilar = Math.min(
            similarPairs.length,
            Math.ceil(queueSize * 0.85),
        );
        const numRandom = queueSize - numSimilar;
        console.log(
            `Comparison type split:`,
            `\n\tSimilar: ${numSimilar}`,
            `\n\tRandom: ${numRandom}`,
        );

        const similarSubset = [...similarPairs]
            .sort(() => Math.random() - 0.5)
            .slice(0, numSimilar);

        const similarPairIds = new Set(
            similarSubset.map((pair) =>
                [pair[0].id, pair[1].id].sort().join('-'),
            ),
        );

        const randomPool = randomPairs.filter((pair) => {
            const pairId = [pair[0].id, pair[1].id].sort().join('-');
            return !similarPairIds.has(pairId);
        });

        const randomSubset = [...randomPool]
            .sort(() => Math.random() - 0.5)
            .slice(0, numRandom);

        const finalQueue = [...similarSubset, ...randomSubset].sort(
            () => Math.random() - 0.5,
        );
        console.log('Final queue:', finalQueue);

        setComparisonQueue(finalQueue);
        setCurrentPair(finalQueue[0] || null);
    }, []);

    // Generate and start a calibration queue
    const startCalibration = useCallback((newItem: CombinedItem) => {
        console.log('--- startCalibration Fired ---');
        const currentItems = itemsRef.current;
        console.log('Received newItem:', newItem);
        console.log('Hook is using this `items` array:', currentItems);

        setIsCalibrating(true);

        const itemInList = currentItems.find((item) => item.id === newItem.id);
        console.log('Found itemInList:', itemInList);
        if (!itemInList) {
            console.error(
                'Premature Exit: newItem was not found in the main items list.',
            );
            return;
        }

        const otherItems = currentItems.filter(
            (item) => item.id !== newItem.id,
        );
        console.log(
            'Found otherItems:',
            otherItems,
            'Count:',
            otherItems.length,
        );
        if (otherItems.length === 0) {
            console.warn('Premature Exit: No other items to compare against.');
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
