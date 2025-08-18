import { ArrowDown, ArrowUp, SlidersHorizontal } from 'lucide-react';

import { Button } from './ui/button';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { type SortOption } from '@/types/types';

type SortControlsProps = {
    sortBy: SortOption;
    sortAsc: boolean;
    isEloDisabled: boolean;
    onSortByChange: (value: SortOption) => void;
    onSortDirChange: () => void;
};

export const SortControls = ({
    sortBy,
    sortAsc,
    isEloDisabled,
    onSortByChange,
    onSortDirChange,
}: SortControlsProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            Sort Options
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Arrange the list based on your preference.
                        </p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Sort by</Label>
                        <div className="col-span-2 flex items-center gap-2">
                            <Select
                                value={sortBy}
                                onValueChange={onSortByChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        value="rating"
                                        disabled={isEloDisabled}
                                    >
                                        Elo
                                    </SelectItem>
                                    <SelectItem value="name">
                                        Alphabetical
                                    </SelectItem>
                                    <SelectItem value="created_at">
                                        Date Added
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSortDirChange}
                            >
                                {sortAsc ? (
                                    <ArrowUp className="h-4 w-4" />
                                ) : (
                                    <ArrowDown className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                    Toggle sort direction
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
