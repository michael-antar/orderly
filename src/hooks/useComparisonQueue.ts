import { useCallback, useEffect, useRef, useState } from 'react';

import { type Item } from '@/types/types';

// Type for a pair of items to be compared
/** A tuple representing two items to be matched head-to-head in a comparison. */
export type ItemPair = [Item, Item];

/**
 * Returns a new randomly shuffled copy of the input array using the Fisher-Yates algorithm.
 * Does **not** mutate the original array.
 *
 * @param array - The array to shuffle.
 * @returns A new array with the same elements in a random order.
 */
const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
};

/** State for the adaptive binary-search calibration process. */
type CalibrationState = {
  newItem: Item; // The item being calibrated
  otherItems: Item[]; // The rest of the ranked list (sorted by rating desc)
  searchLow: number; // Lower bound index in otherItems
  searchHigh: number; // Upper bound index in otherItems
  round: number; // Current round (0-indexed)
  maxRounds: number; // Total rounds (3)
  usedOpponentIds: Set<string>; // Prevents the same gatekeeper appearing twice
};

/**
 * Picks a target index with positional jitter.
 * Jitter is ±25% of the current search range, minimum ±1.
 * Clamped to [low, high] so the pick never escapes the current search zone.
 */
const pickWithJitter = (targetIndex: number, low: number, high: number): number => {
  const rangeSize = high - low + 1;
  const jitterRange = Math.max(1, Math.ceil(rangeSize * 0.25));
  const offset = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange;
  return Math.max(low, Math.min(high, targetIndex + offset));
};

/**
 * Manages state and logic for item comparison sessions.
 *
 * Supports two modes:
 * - **Normal** (`startNormalComparison`): Builds a queue of random and rating-similar pairs
 *   from all ranked items, biased towards close matchups for more informative comparisons.
 * - **Calibration** (`startCalibration` / `advanceCalibration`): Uses an adaptive binary
 *   search to place a new item. Each round narrows the search range based on win/loss,
 *   with positional jitter to prevent the same "gatekeeper" items every time.
 *
 * Handles prop synchronisation so the internal item list reflects the latest external
 * `initialItems` whenever a new comparison session begins.
 *
 * @param initialItems - The current list of ranked items available for comparison.
 *   **Must be sorted by rating descending** (as provided by `comparisonRankedItems`).
 *   The seeding logic relies on this ordering for index-proximity heuristics.
 */
export const useComparisonQueue = (initialItems: Item[]) => {
  const [items, setItems] = useState<Item[]>(initialItems); // Holds the list as it's modified by `updateRatings`

  const prevInitialItemsRef = useRef(initialItems); // Tracks the `initialItems` prop from the previous render

  // Check if the props have changed this render
  // This is `true` when a new session begins
  const initialItemsHaveChanged = prevInitialItemsRef.current !== initialItems;

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
  const [calibrationRound, setCalibrationRound] = useState(0);
  const [calibrationMaxRounds, setCalibrationMaxRounds] = useState(0);
  const [, setCalibrationState] = useState<CalibrationState | null>(null);

  const updateRatings = useCallback(
    (
      updatedItem1: { id: string; rating: number; rd: number },
      updatedItem2: { id: string; rating: number; rd: number },
    ) => {
      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id === updatedItem1.id) {
            return { ...item, rating: updatedItem1.rating, rd: updatedItem1.rd };
          }
          if (item.id === updatedItem2.id) {
            return { ...item, rating: updatedItem2.rating, rd: updatedItem2.rd };
          }
          return item;
        }),
      );
    },
    [],
  );

  // Generate mixed queue of random, similar, and high-uncertainty pairs for comparison
  const startNormalComparison = useCallback(() => {
    setIsCalibrating(false);

    const currentItems = itemsRef.current;

    if (currentItems.length < 2) {
      setComparisonQueue([]);
      setCurrentPair(null);
      return;
    }

    // --- Identify high-RD (uncertain) items that benefit most from comparisons ---
    const avgRd = currentItems.reduce((sum, item) => sum + item.rd, 0) / currentItems.length;
    const uncertainItems = currentItems.filter((item) => item.rd > Math.max(avgRd, 100));

    // Build pairs involving at least one uncertain item against a nearby-rated opponent
    const uncertainPairs: ItemPair[] = [];
    for (const item of uncertainItems) {
      // Find the closest items by index position (list is sorted by rating desc)
      const itemIndex = currentItems.indexOf(item);
      for (let offset = 1; offset <= 3 && uncertainPairs.length < 30; offset++) {
        if (itemIndex - offset >= 0) {
          uncertainPairs.push([item, currentItems[itemIndex - offset]]);
        }
        if (itemIndex + offset < currentItems.length) {
          uncertainPairs.push([item, currentItems[itemIndex + offset]]);
        }
      }
    }

    // --- Similar pairs: close in rating or position ---
    // Use a dynamic rating threshold based on average RD — items with overlapping
    // confidence intervals are still meaningfully comparable
    const similarThreshold = Math.max(200, Math.round(avgRd * 1.5));

    const similarPairs: ItemPair[] = [];
    for (let i = 0; i < currentItems.length; i++) {
      const itemA = currentItems[i];
      for (let j = i + 1; j < currentItems.length; j++) {
        const itemB = currentItems[j];

        const indexDifference = j - i;
        const ratingDifference =
          itemA.rating !== null && itemB.rating !== null ? Math.abs(itemA.rating - itemB.rating) : Infinity;

        // Break early if impossible for any future matches (items are sorted
        // by rating desc, so later items only get further away in rating).
        if (indexDifference > 2 && ratingDifference > similarThreshold) {
          break;
        }

        // Only include pairs that are close in either index position or rating
        if (indexDifference <= 2 || ratingDifference <= similarThreshold) {
          similarPairs.push([itemA, itemB]);
        }
      }
    }

    // --- Assemble the queue with budget allocation ---
    const maxPossiblePairs = (currentItems.length * (currentItems.length - 1)) / 2;
    const targetQueueSize = Math.min(100, maxPossiblePairs);

    // Budget: up to 20 uncertain, up to 65 similar, rest random
    const numUncertain = Math.min(uncertainPairs.length, 20);
    const numSimilar = Math.min(similarPairs.length, Math.max(0, targetQueueSize - numUncertain - 15));
    const numRandom = Math.max(0, targetQueueSize - numUncertain - numSimilar);

    const uncertainSubset = shuffle(uncertainPairs).slice(0, numUncertain);
    const similarSubset = shuffle(similarPairs).slice(0, numSimilar);

    const usedPairIds = new Set<string>(
      [...uncertainSubset, ...similarSubset].map((pair) => [pair[0].id, pair[1].id].sort().join('-')),
    );

    let randomSubset: ItemPair[] = [];

    if (numRandom > 0) {
      const availableRandomPairs = maxPossiblePairs - usedPairIds.size;

      if (numRandom > availableRandomPairs / 4) {
        // Shuffle and slice (for dense selection)
        const randomPool: ItemPair[] = [];
        for (let i = 0; i < currentItems.length; i++) {
          for (let j = i + 1; j < currentItems.length; j++) {
            const itemA = currentItems[i];
            const itemB = currentItems[j];
            const pairId = [itemA.id, itemB.id].sort().join('-');
            if (!usedPairIds.has(pairId)) {
              randomPool.push([itemA, itemB]);
            }
          }
        }
        randomSubset = shuffle(randomPool).slice(0, numRandom);
      } else {
        // Rejection sampling (for sparse selections)
        const addedPairIds = new Set<string>(usedPairIds);
        const listSize = currentItems.length;
        const maxIterations = numRandom * 10; // Safety cap to prevent infinite loops
        let iterations = 0;

        while (randomSubset.length < numRandom && iterations < maxIterations) {
          iterations++;
          const i = Math.floor(Math.random() * listSize);
          let j = Math.floor(Math.random() * listSize);
          while (i === j) {
            j = Math.floor(Math.random() * listSize);
          }

          const itemA = currentItems[i];
          const itemB = currentItems[j];
          const pairId = [itemA.id, itemB.id].sort().join('-');

          if (!addedPairIds.has(pairId)) {
            addedPairIds.add(pairId);
            randomSubset.push([itemA, itemB]);
          }
        }
      }
    }

    const finalQueue = shuffle([...uncertainSubset, ...similarSubset, ...randomSubset]);

    setComparisonQueue(finalQueue);
    setCurrentPair(finalQueue[0] || null);
  }, []);

  // Initialize adaptive calibration (binary search)
  const startCalibration = useCallback((newItem: Item) => {
    setIsCalibrating(true);
    const currentItems = itemsRef.current;

    const itemInList = currentItems.find((item) => item.id === newItem.id);
    if (!itemInList) {
      console.error('[useComparisonQueue] startCalibration: newItem was not found in the main items list.');
      return;
    }

    const otherItems = currentItems.filter((item) => item.id !== newItem.id);
    if (otherItems.length === 0) {
      setCalibrationState(null);
      setCurrentPair(null);
      return;
    }

    const maxRounds = Math.min(3, otherItems.length);
    const low = 0;
    const high = otherItems.length - 1;
    const midIndex = Math.floor((low + high) / 2);
    const opponentIndex = pickWithJitter(midIndex, low, high);

    const opponent = otherItems[opponentIndex];
    const state: CalibrationState = {
      newItem: itemInList,
      otherItems,
      searchLow: low,
      searchHigh: high,
      round: 0,
      maxRounds,
      usedOpponentIds: new Set([opponent.id]),
    };

    setCalibrationState(state);
    setCalibrationRound(1);
    setCalibrationMaxRounds(maxRounds);
    setCurrentPair([itemInList, opponent]);
  }, []);

  /**
   * Advance calibration after a comparison result.
   * Narrows the binary search range based on whether the new item won or lost,
   * then picks the next opponent from the midpoint of the new range (with jitter).
   *
   * @param winnerId - The id of the item that won the comparison.
   */
  const advanceCalibration = useCallback((winnerId: string) => {
    setCalibrationState((prev) => {
      if (!prev) return null;

      const { newItem, otherItems, searchLow, searchHigh, round, maxRounds, usedOpponentIds } = prev;
      const nextRound = round + 1;

      // Calibration complete
      if (nextRound >= maxRounds) {
        setCurrentPair(null);
        setIsCalibrating(false);
        setCalibrationRound(0);
        setCalibrationMaxRounds(0);
        return null;
      }

      const mid = Math.floor((searchLow + searchHigh) / 2);
      let newLow: number;
      let newHigh: number;

      if (winnerId === newItem.id) {
        // New item won → it's better than midpoint, search the upper half (lower indices = higher rated)
        newLow = searchLow;
        newHigh = Math.max(searchLow, mid - 1);
      } else {
        // New item lost → it's worse than midpoint, search the lower half (higher indices = lower rated)
        newLow = Math.min(searchHigh, mid + 1);
        newHigh = searchHigh;
      }

      const nextMid = Math.floor((newLow + newHigh) / 2);
      let opponentIndex = pickWithJitter(nextMid, newLow, newHigh);

      // Avoid re-using the same gatekeeper opponent — scan outward from the picked index
      if (usedOpponentIds.has(otherItems[opponentIndex].id)) {
        let found = false;
        // First try within the current search range
        for (let delta = 1; delta <= newHigh - newLow; delta++) {
          for (const dir of [1, -1]) {
            const candidate = opponentIndex + delta * dir;
            if (candidate >= newLow && candidate <= newHigh && !usedOpponentIds.has(otherItems[candidate].id)) {
              opponentIndex = candidate;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        // Fallback: expand beyond range to find any unused opponent
        if (!found) {
          for (let delta = 1; delta < otherItems.length; delta++) {
            for (const dir of [1, -1]) {
              const candidate = opponentIndex + delta * dir;
              if (candidate >= 0 && candidate < otherItems.length && !usedOpponentIds.has(otherItems[candidate].id)) {
                opponentIndex = candidate;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      }

      const nextUsed = new Set(usedOpponentIds);
      nextUsed.add(otherItems[opponentIndex].id);

      setCurrentPair([newItem, otherItems[opponentIndex]]);
      setCalibrationRound(nextRound + 1);

      return {
        ...prev,
        searchLow: newLow,
        searchHigh: newHigh,
        round: nextRound,
        usedOpponentIds: nextUsed,
      };
    });
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
    advanceCalibration,
    isCalibrating,
    calibrationRound,
    calibrationMaxRounds,
    updateRatings,
  };
};
