import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabaseClient';
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

import { useAuth } from '@/contexts/AuthContext';

import { categoryConfig } from '@/config/categoryConfig';
import {
    type SortOption,
    type AppliedFilters,
    type FilterRule,
    type Tag,
    type Category,
    type FilterField,
    type FilterOperator,
    type PriceRange,
} from '@/types/types';

const stringOperators: { value: FilterOperator; label: string }[] = [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'contains', label: 'contains' },
];

const numberOperators: { value: FilterOperator; label: string }[] = [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '≥' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '≤' },
];

const priceRangeOperators: { value: FilterOperator; label: string }[] = [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
];

const priceOptions: PriceRange[] = ['$', '$$', '$$$', '$$$$'];

type SortControlsProps = {
    sortBy: SortOption;
    sortAsc: boolean;
    isEloDisabled: boolean;
    filters: AppliedFilters;
    category: Category;
    onApply: (
        newSortBy: SortOption,
        newSortAsc: boolean,
        newFilters: AppliedFilters,
    ) => void;
};

export const SortControls = ({
    sortBy,
    sortAsc,
    isEloDisabled,
    filters,
    category,
    onApply,
}: SortControlsProps) => {
    const { user } = useAuth();
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);

    // Manages popover and its "draft" values
    const [isOpen, setIsOpen] = useState(false);
    const [localSortBy, setLocalSortBy] = useState<SortOption>(sortBy);
    const [localSortAsc, setLocalSortAsc] = useState(sortAsc);
    const [localFilters, setLocalFilters] = useState<AppliedFilters>(filters);

    // Count of how many descendent components (selects, popovers) are open in order to prevent propagation closing of parent modal
    const [openDescendants, setOpenDescendants] = useState(0);
    const [isTagPopoverOpen, setTagPopoverOpen] = useState(false);

    useEffect(() => {
        const fetchTags = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', user.id)
                .eq('category', category);
            setAvailableTags(data || []);
        };
        fetchTags();
    }, [user, category]);

    // Reset sort/filter values upon open
    useEffect(() => {
        if (isOpen) {
            setLocalSortBy(sortBy);
            setLocalSortAsc(sortAsc);
            setLocalFilters(filters);
            setOpenDescendants(0);
        }
    }, [isOpen, sortBy, sortAsc, filters]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        // When the popover closes, apply the changes
        if (!open) {
            onApply(localSortBy, localSortAsc, localFilters);
        }
    };

    const handleDescendantOpenChange = (open: boolean) => {
        setOpenDescendants((prev) => (open ? prev + 1 : Math.max(0, prev - 1)));
    };

    const handleAddRule = () => {
        const newRule: FilterRule = {
            id: Date.now().toString(),
            field: '',
            operator: '',
            value: '',
        };
        setLocalFilters({
            ...localFilters,
            rules: [...localFilters.rules, newRule],
        });
    };

    const handleRemoveRule = (id: string) => {
        setLocalFilters({
            ...localFilters,
            rules: localFilters.rules.filter((rule) => rule.id !== id),
        });
    };

    const handleChangeRule = (
        id: string,
        field: keyof FilterRule,
        value: string | number,
    ) => {
        setLocalFilters({
            ...localFilters,
            rules: localFilters.rules.map((rule) =>
                rule.id === id ? { ...rule, [field]: value } : rule,
            ),
        });
    };

    const handleClearFilters = () => {
        setLocalFilters({ tags: [], rules: [] });
    };

    const { filterableFields } = categoryConfig[category];

    const getOperatorsForField = (fieldValue: FilterField | '') => {
        const field = filterableFields.find((f) => f.value === fieldValue);
        if (!field) return [];
        switch (field.type) {
            case 'string':
                return stringOperators;
            case 'number':
                return numberOperators;
            case 'price_range':
                return priceRangeOperators;
            default:
                return [];
        }
    };

    const isPriceRangeField = (fieldValue: FilterField | '') => {
        const field = filterableFields.find((f) => f.value === fieldValue);
        return field?.type === 'price_range';
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80"
                onPointerDownOutside={(e) => {
                    // If any descendant is open, prevent the main popover from closing
                    if (openDescendants > 0) {
                        e.preventDefault();
                    }
                }}
            >
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            Sort & Filter
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Arrange and filter the list to find what you're
                            looking for.
                        </p>
                    </div>

                    <Separator />

                    {/* Sort Section */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="sort-by-select">Sort by</Label>
                        <div className="col-span-2 flex items-center gap-2">
                            <Select
                                value={localSortBy}
                                onValueChange={(val) =>
                                    setLocalSortBy(val as SortOption)
                                }
                                onOpenChange={handleDescendantOpenChange}
                            >
                                <SelectTrigger
                                    id="sort-by-select"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent
                                    onEscapeKeyDown={(e) => e.preventDefault()}
                                >
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
                                onClick={() => setLocalSortAsc((prev) => !prev)}
                            >
                                {localSortAsc ? (
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
                            selectedTags={localFilters.tags}
                            availableTags={availableTags}
                            onTagsChange={(newTags) =>
                                setLocalFilters({
                                    ...localFilters,
                                    tags: newTags,
                                })
                            }
                            category={category}
                            popoverOpen={isTagPopoverOpen}
                            onPopoverOpenChange={setTagPopoverOpen}
                        />

                        {/* Category Field Filter */}
                        {localFilters.rules.map((rule, index) => (
                            <div key={rule.id} className="space-y-2">
                                <Label
                                    htmlFor={`field-${rule.id}`}
                                    className="text-xs text-muted-foreground"
                                >
                                    Rule {index + 1}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={rule.field}
                                        onValueChange={(value) =>
                                            handleChangeRule(
                                                rule.id,
                                                'field',
                                                value,
                                            )
                                        }
                                        onOpenChange={
                                            handleDescendantOpenChange
                                        }
                                    >
                                        <SelectTrigger id={`field-${rule.id}`}>
                                            <SelectValue placeholder="Field" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filterableFields.map((f) => (
                                                <SelectItem
                                                    key={f.value}
                                                    value={f.value}
                                                >
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Label
                                        htmlFor={`operator-${rule.id}`}
                                        className="sr-only"
                                    >
                                        Operator for Rule {index + 1}
                                    </Label>
                                    <Select
                                        value={rule.operator}
                                        onValueChange={(value) =>
                                            handleChangeRule(
                                                rule.id,
                                                'operator',
                                                value,
                                            )
                                        }
                                        disabled={!rule.field}
                                        onOpenChange={
                                            handleDescendantOpenChange
                                        }
                                    >
                                        <SelectTrigger
                                            id={`operator-${rule.id}`}
                                            className="w-2/3"
                                        >
                                            <SelectValue placeholder="Operator" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getOperatorsForField(
                                                rule.field,
                                            ).map((o) => (
                                                <SelectItem
                                                    key={o.value}
                                                    value={o.value}
                                                >
                                                    {o.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                            handleRemoveRule(rule.id)
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <Label
                                    htmlFor={`value-${rule.id}`}
                                    className="sr-only"
                                >
                                    Value for Rule {index + 1}
                                </Label>
                                {isPriceRangeField(rule.field) ? (
                                    <Select
                                        value={String(rule.value)}
                                        onValueChange={(value) =>
                                            handleChangeRule(
                                                rule.id,
                                                'value',
                                                value,
                                            )
                                        }
                                        onOpenChange={
                                            handleDescendantOpenChange
                                        }
                                    >
                                        <SelectTrigger id={`value-${rule.id}`}>
                                            <SelectValue placeholder="Select a price..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {priceOptions.map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id={`value-${rule.id}`}
                                        placeholder="Value..."
                                        value={rule.value}
                                        type={
                                            filterableFields.find(
                                                (f) => f.value === rule.field,
                                            )?.type === 'number'
                                                ? 'number'
                                                : 'text'
                                        }
                                        onChange={(e) =>
                                            handleChangeRule(
                                                rule.id,
                                                'value',
                                                e.target.value,
                                            )
                                        }
                                        disabled={!rule.operator}
                                    />
                                )}
                            </div>
                        ))}

                        {/* Add Rule Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddRule}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Rule
                        </Button>

                        {/* Clear Button */}
                        <Separator />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                        >
                            Clear All Filters
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
