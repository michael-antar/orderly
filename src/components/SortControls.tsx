import { ArrowDown, ArrowUp, Plus, SlidersHorizontal, X } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { TagInput } from './TagInput';

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
                            Arrange and filter the list to find what you're
                            looking for.
                        </p>
                    </div>

                    <Separator />

                    {/* Sort Section */}
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

                    <Separator />

                    {/* Filter Section */}
                    <div className="space-y-4">
                        <Label>Filter by</Label>

                        {/* Tag Filter */}
                        <TagInput
                            selectedTags={[]}
                            availableTags={[]}
                            onTagsChange={() => {}}
                            category="movie"
                            popoverOpen={false}
                            onPopoverOpenChange={() => {}}
                        />

                        {/* Category Field Filter */}
                        <Label>Fields</Label>
                        <div className="flex items-center gap-2">
                            <Select defaultValue="director">
                                <SelectTrigger>
                                    <SelectValue placeholder="Field" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="director">
                                        Director
                                    </SelectItem>
                                    <SelectItem value="release_year">
                                        Release Year
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="is">
                                <SelectTrigger className="w-2/3">
                                    <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="is">is</SelectItem>
                                    <SelectItem value="is_not">
                                        is not
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Input placeholder="Value..." />
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Filter
                        </Button>

                        {/* Clear Button */}
                        <Separator />
                        <Button variant="ghost" size="sm">
                            Clear All Filters
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
