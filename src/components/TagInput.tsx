import { useCallback, useState } from 'react';

import { X } from 'lucide-react';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from './ui/button';
import { Label } from '@/components/ui/label';
import { TagBadge } from './TagBadge';

import { type Category, type Tag } from '@/types/types';

type TagInputProps = {
    selectedTags: Tag[];
    availableTags: Tag[];
    onTagsChange: (newTags: Tag[]) => void;
    category: Category;
};

export const TagInput = ({
    selectedTags,
    availableTags,
    onTagsChange,
    category,
}: TagInputProps) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const handleSelect = useCallback(
        (tag: Tag) => {
            setInputValue('');
            onTagsChange([...selectedTags, tag]);
        },
        [selectedTags, onTagsChange],
    );

    const handleCreate = useCallback(
        (tagName: string) => {
            setInputValue('');
            // Create a temporary tag object. The final ID will be set when it's saved to the DB.
            const newTag: Tag = {
                id: Date.now(),
                name: tagName,
                category: category,
                user_id: '',
            }; // Placeholder values
            onTagsChange([...selectedTags, newTag]);
        },
        [selectedTags, onTagsChange, category],
    );

    const handleRemove = useCallback(
        (tagToRemove: Tag) => {
            onTagsChange(
                selectedTags.filter((tag) => tag.id !== tagToRemove.id),
            );
        },
        [selectedTags, onTagsChange],
    );

    const filteredTags = availableTags.filter(
        (tag) =>
            !selectedTags.some((selected) => selected.id === tag.id) &&
            tag.name.toLowerCase().includes(inputValue.toLowerCase()),
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Close on Escape
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
        }
        // Close on Enter when input is empty
        if (e.key === 'Enter' && !inputValue) {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
        }
    };

    return (
        <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Tags</Label>
            <div className="col-span-3">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-auto"
                        >
                            <div className="flex gap-2 flex-wrap">
                                {selectedTags.length > 0 ? (
                                    selectedTags.map((tag) => (
                                        <div
                                            key={tag.id}
                                            className="flex items-center"
                                        >
                                            <TagBadge name={tag.name} />
                                            <span
                                                role="button"
                                                aria-label={`Remove ${tag.name}`}
                                                className="ml-1 text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemove(tag);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground">
                                        Select tags...
                                    </span>
                                )}
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                    >
                        <Command onKeyDown={handleKeyDown}>
                            <CommandInput
                                placeholder="Search or create tag..."
                                value={inputValue}
                                onValueChange={setInputValue}
                            />
                            <CommandList>
                                {inputValue &&
                                    !availableTags.some(
                                        (t) =>
                                            t.name.toLowerCase() ===
                                            inputValue.toLowerCase(),
                                    ) && (
                                        <CommandItem
                                            onSelect={() =>
                                                handleCreate(inputValue)
                                            }
                                        >
                                            Create "{inputValue}"
                                        </CommandItem>
                                    )}
                                <CommandGroup heading="Suggestions">
                                    {filteredTags.map((tag) => (
                                        <CommandItem
                                            key={tag.id}
                                            onSelect={() => handleSelect(tag)}
                                        >
                                            {tag.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandEmpty>No results found.</CommandEmpty>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
