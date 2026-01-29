import { useState, useEffect, useMemo } from 'react';

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

import {
    type AppliedFilters,
    type FilterRule,
    type Tag,
    type FilterOperator,
    type CategoryDefinition,
    type FieldDefinition,
    type ItemPropertyValue,
} from '@/types/types';

const TYPE_OPERATORS: Record<
    string,
    { value: FilterOperator; label: string }[]
> = {
    string: [
        { value: 'contains', label: 'contains' },
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
    ],
    number: [
        { value: 'is', label: '=' },
        { value: 'is_not', label: '≠' },
        { value: 'gt', label: '>' },
        { value: 'gte', label: '≥' },
        { value: 'lt', label: '<' },
        { value: 'lte', label: '≤' },
    ],
    boolean: [{ value: 'is', label: 'is' }],
    select: [
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
    ],
    location: [{ value: 'contains', label: 'contains' }],
};

type SortControlsProps = {
    categoryDef: CategoryDefinition;
    isEloDisabled: boolean;

    sortBy: string;
    sortAsc: boolean;
    filters: AppliedFilters;

    onSortApply: (
        newSortBy: string,
        newSortAsc: boolean,
        newFilters: AppliedFilters,
    ) => void;
};

export const SortControls = ({
    categoryDef,
    isEloDisabled,
    sortBy,
    sortAsc,
    filters,
    onSortApply,
}: SortControlsProps) => {
    const { user } = useAuth();
    const [existingTags, setExistingTags] = useState<Tag[]>([]);

    // Manages popover and its "draft" values
    // Changes are only applied when popover is closed
    const [isOpen, setIsOpen] = useState(false);

    // Receive current state to prevent resetting controls after updating due to disabling sortBy rating
    const [localSortBy, setLocalSortBy] = useState<string>(sortBy);
    const [localSortAsc, setLocalSortAsc] = useState<boolean>(sortAsc);
    const [localFilters, setLocalFilters] = useState<AppliedFilters>(filters);

    // Count of how many descendent components (selects, popovers) are open in order to prevent propagation closing of parent modal
    const [openDescendants, setOpenDescendants] = useState(0);
    const [isTagPopoverOpen, setTagPopoverOpen] = useState(false);

    // Fetch existingTags upon mount
    useEffect(() => {
        const fetchTags = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', user.id)
                .eq('category_def_id', categoryDef.id);
            setExistingTags(data || []);
        };
        fetchTags();
    }, [user, categoryDef.id]);

    // Sync props to local state when popover opens or props change externally
    useEffect(() => {
        if (isOpen) {
            setLocalSortBy(sortBy);
            setLocalSortAsc(sortAsc);
            setLocalFilters(filters);

            setOpenDescendants(0);
        }
    }, [isOpen, sortBy, sortAsc, filters]);

    // Combine base and dynamic sort options. Memoize to only calculate once on every render
    const sortOptions = useMemo(() => {
        const base = [
            { label: 'Rating (Elo)', value: 'rating', disabled: isEloDisabled },
            { label: 'Name', value: 'name', disabled: false },
            { label: 'Date Added', value: 'created_at', disabled: false },
        ];

        // Sortable dynamic fields: numbers, string, boolean
        const dynamic = categoryDef.field_definitions
            .filter((f) =>
                ['number', 'string', 'boolean', 'select'].includes(f.type),
            )
            .map((f) => ({
                label: f.label,
                value: `properties.${f.key}`,
                disabled: false,
            }));

        return [...base, ...dynamic];
    }, [categoryDef, isEloDisabled]);

    // Get list of filterable fields (type must be included in supported TYPE_OPERATORS)
    const filterRuleOptions = useMemo(() => {
        const standardFields: FieldDefinition[] = [
            { key: 'name', type: 'string', label: 'Name' },
            { key: 'rating', type: 'number', label: 'Rating' },
        ];

        const dynamicFields = categoryDef.field_definitions.filter((f) =>
            Object.keys(TYPE_OPERATORS).includes(f.type),
        );

        return [...standardFields, ...dynamicFields];
    }, [categoryDef]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        // When the popover closes, apply the changes
        if (!open) {
            onSortApply(localSortBy, localSortAsc, localFilters);
        }
    };

    const handleDescendantOpenChange = (open: boolean) => {
        setOpenDescendants((prev) => (open ? prev + 1 : Math.max(0, prev - 1)));
    };

    const toggleSortDirection = () => {
        setLocalSortAsc((prev) => !prev);
    };

    const handleAddBlankRule = () => {
        const newRule: FilterRule = {
            id: Date.now().toString(),
            field_key: '',
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
        key: keyof FilterRule | 'field',
        value: ItemPropertyValue,
    ) => {
        setLocalFilters((prev) => ({
            ...prev,
            rules: prev.rules.map((r) => {
                if (r.id !== id) return r;

                // If changing field, reset operator/value to avoid type mismatches
                if (key === 'field') {
                    return {
                        ...r,
                        field_key: value as string,
                        operator: '' as FilterOperator,
                        value: '',
                    };
                }
                return { ...r, [key]: value };
            }),
        }));
    };

    const handleClearFilters = () => {
        setLocalFilters({ tags: [], rules: [] });
    };

    const getFieldDef = (
        fieldKey: ItemPropertyValue,
    ): FieldDefinition | undefined => {
        return filterRuleOptions.find((f) => f.key === fieldKey);
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Sort & Filter">
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-80 p-0"
                onPointerDownOutside={(e) => {
                    // If any descendant is open, prevent the main popover from closing
                    if (openDescendants > 0 || isTagPopoverOpen) {
                        e.preventDefault();
                    }
                }}
            >
                {/* Flex container for entire popover */}
                <div className="flex flex-col max-h-[75vh]">
                    {/* Header + Sort Content (not scrollable) */}
                    <div className="p-4 pb-0 flex-shrink 0">
                        {/* Header */}
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">
                                Sort & Filter
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Arrange and filter the list to find what you're
                                looking for.
                            </p>
                        </div>

                        <Separator className="my-4" />

                        {/* Sort Section */}
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="sort-by-select">Sort by</Label>
                            <div className="col-span-2 flex items-center gap-2">
                                <Select
                                    value={localSortBy}
                                    onValueChange={setLocalSortBy}
                                    onOpenChange={handleDescendantOpenChange}
                                >
                                    <SelectTrigger
                                        id="sort-by-select"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Sort by..." />
                                    </SelectTrigger>

                                    <SelectContent
                                        onEscapeKeyDown={(e) =>
                                            e.preventDefault()
                                        }
                                    >
                                        {sortOptions.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                disabled={opt.disabled}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleSortDirection}
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

                        <Separator className="my-4" />
                    </div>

                    {/* Filter Content (scrollable) */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Filter Section */}
                        <div className="space-y-4">
                            <Label>Filter by</Label>

                            {/* Tag Filter */}
                            <TagInput
                                selectedTags={localFilters.tags}
                                existingTags={existingTags}
                                onTagsChange={(newTags) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        tags: newTags,
                                    })
                                }
                                popoverOpen={isTagPopoverOpen}
                                onPopoverOpenChange={setTagPopoverOpen}
                            />

                            {/* Category Field Filter Rules */}
                            <div className="space-y-3">
                                {localFilters.rules.map((rule, idx) => {
                                    const fieldDef = getFieldDef(
                                        rule.field_key,
                                    );
                                    const availableOps = fieldDef
                                        ? TYPE_OPERATORS[fieldDef.type]
                                        : [];

                                    return (
                                        <div
                                            key={rule.id}
                                            className="p-3 border rounded-md bg-muted/20 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-muted-foreground">
                                                    Condition {idx + 1}
                                                </Label>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 -mr-2"
                                                    onClick={() =>
                                                        handleRemoveRule(
                                                            rule.id,
                                                        )
                                                    }
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Field & Operator Row */}
                                            <div className="flex gap-2">
                                                <Select
                                                    value={rule.field_key}
                                                    onValueChange={(val) =>
                                                        handleChangeRule(
                                                            rule.id,
                                                            'field',
                                                            val,
                                                        )
                                                    }
                                                    onOpenChange={
                                                        handleDescendantOpenChange
                                                    }
                                                >
                                                    <SelectTrigger className="flex-1 h-8 text-xs">
                                                        <SelectValue placeholder="Field" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filterRuleOptions.map(
                                                            (f) => (
                                                                <SelectItem
                                                                    key={f.key}
                                                                    value={
                                                                        f.key
                                                                    }
                                                                >
                                                                    {f.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={rule.operator}
                                                    onValueChange={(val) =>
                                                        handleChangeRule(
                                                            rule.id,
                                                            'operator',
                                                            val,
                                                        )
                                                    }
                                                    onOpenChange={
                                                        handleDescendantOpenChange
                                                    }
                                                    disabled={!rule.field_key}
                                                >
                                                    <SelectTrigger className="w-[80px] h-8 text-xs">
                                                        <SelectValue placeholder="Op" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableOps?.map(
                                                            (op) => (
                                                                <SelectItem
                                                                    key={
                                                                        op.value
                                                                    }
                                                                    value={
                                                                        op.value
                                                                    }
                                                                >
                                                                    {op.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Value Input Row */}
                                            <div>
                                                {fieldDef?.type === 'select' &&
                                                fieldDef.options ? (
                                                    <Select
                                                        value={String(
                                                            rule.value,
                                                        )}
                                                        onValueChange={(val) =>
                                                            handleChangeRule(
                                                                rule.id,
                                                                'value',
                                                                val,
                                                            )
                                                        }
                                                        onOpenChange={
                                                            handleDescendantOpenChange
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Select value..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {fieldDef.options.map(
                                                                (opt) => (
                                                                    <SelectItem
                                                                        key={
                                                                            opt
                                                                        }
                                                                        value={
                                                                            opt
                                                                        }
                                                                    >
                                                                        {opt}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : fieldDef?.type ===
                                                  'boolean' ? (
                                                    <Select
                                                        value={String(
                                                            rule.value,
                                                        )}
                                                        onValueChange={(val) =>
                                                            handleChangeRule(
                                                                rule.id,
                                                                'value',
                                                                val === 'true',
                                                            )
                                                        }
                                                        onOpenChange={
                                                            handleDescendantOpenChange
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Select..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="true">
                                                                True
                                                            </SelectItem>
                                                            <SelectItem value="false">
                                                                False
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        className="h-8 text-xs"
                                                        placeholder="Value..."
                                                        type={
                                                            fieldDef?.type ===
                                                            'number'
                                                                ? 'number'
                                                                : 'text'
                                                        }
                                                        value={String(
                                                            rule.value,
                                                        )}
                                                        onChange={(e) =>
                                                            handleChangeRule(
                                                                rule.id,
                                                                'value',
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            !rule.operator
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Rule Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddBlankRule}
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
                </div>
            </PopoverContent>
        </Popover>
    );
};
