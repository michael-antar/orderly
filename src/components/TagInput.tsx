import { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';

import { Badge } from './ui/badge';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
// TODO: Is this still needed?
// import { TagBadge } from './TagBadge';

import type { Tag } from '@/types/types';

type TagInputProps = {
    selectedTags: Tag[];
    existingTags: Tag[];
    categoryDefId?: string; // If omitted, "Create New" is disabled
    placeholder?: string;
    popoverOpen?: boolean; // Optional control popover state from parent
    onTagsChange: (newTags: Tag[]) => void;
    onPopoverOpenChange?: (open: boolean) => void;
};

export const TagInput = ({
    selectedTags,
    existingTags,
    categoryDefId,
    placeholder = 'Add tags...',
    popoverOpen,
    onTagsChange,
    onPopoverOpenChange,
}: TagInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const [internalOpen, setInternalOpen] = useState(false);

    // Handle controlled vs uncontrolled open state
    const isOpen = popoverOpen ?? internalOpen;
    const setOpen = onPopoverOpenChange ?? setInternalOpen;

    const inputRef = useRef<HTMLInputElement>(null);

    const handleSelect = (tag: Tag) => {
        // Prevent duplicates
        if (!selectedTags.some((t) => t.id === tag.id)) {
            onTagsChange([...selectedTags, tag]);
        }
        setInputValue('');
        setOpen(false);
    };

    const handleUnselect = (tagToRemove: Tag) => {
        onTagsChange(selectedTags.filter((t) => t.id !== tagToRemove.id));
    };

    const handleCreate = () => {
        if (!inputValue.trim() || !categoryDefId) return;

        const newTagName = inputValue.trim();

        // Select instead if already exists
        const existing = existingTags.find(
            (t) => t.name.toLowerCase() === newTagName.toLowerCase(),
        );

        if (existing) {
            handleSelect(existing);
            return;
        }

        // Create a temp tag object
        // `Date.now()` will create a temp ID > 1 mil, which is treated as new by the hooks
        const newTag: Tag = {
            id: Math.floor(Date.now() + Math.random()),
            name: newTagName,
            category_def_id: categoryDefId,
            user_id: '',
        };

        onTagsChange([...selectedTags, newTag]);
        setInputValue('');
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const input = inputRef.current;
        if (input) {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (input.value === '' && selectedTags.length > 0) {
                    handleUnselect(selectedTags[selectedTags.length - 1]);
                }
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
            }
        }
    };

    // Filter existing tags based on search input
    const filteredTags = existingTags.filter(
        (tag) =>
            !selectedTags.some((selected) => selected.id === tag.id) &&
            tag.name.toLowerCase().includes(inputValue.toLowerCase()),
    );

    return (
        <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md flex items-center flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    onClick={() => inputRef.current?.focus()}
                >
                    {selectedTags.map((tag) => (
                        <Badge
                            key={tag.id}
                            variant="secondary"
                            className="gap-1 pr-1"
                        >
                            {tag.name}
                            <button
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleUnselect(tag);
                                    }
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleUnselect(tag);
                                }}
                                title="Remove tag"
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            selectedTags.length === 0 ? placeholder : ''
                        }
                        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[80px]"
                    />
                </div>
            </PopoverTrigger>

            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
            >
                <Command>
                    <CommandList>
                        {/* Show "Create New" option if input exists and definition ID is present */}
                        {inputValue.trim().length > 0 && categoryDefId && (
                            <CommandGroup>
                                <CommandItem
                                    onSelect={handleCreate}
                                    className="cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{inputValue}"
                                </CommandItem>
                            </CommandGroup>
                        )}

                        <CommandGroup heading="Available Tags">
                            {filteredTags.length === 0 && (
                                <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                                    No matching tags found.
                                </p>
                            )}
                            {filteredTags.map((tag) => (
                                <CommandItem
                                    key={tag.id}
                                    onSelect={() => handleSelect(tag)}
                                    className="cursor-pointer"
                                >
                                    {tag.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
