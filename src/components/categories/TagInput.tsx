import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/types';

import { TagBadge } from './TagBadge';

export interface TagInputProps {
  selectedTags: Tag[];
  existingTags: Tag[];
  /** If omitted, "Create New" is disabled */
  categoryDefId?: string;
  /** If blank, "Select tags..." */
  placeholder?: string;
  /** Optional control popover state from parent */
  popoverOpen?: boolean;
  onTagsChange: (newTags: Tag[]) => void;
  onPopoverOpenChange?: (open: boolean) => void;
}

/**
 * A searchable, multi-select combobox for managing tags.
 * Supports on-the-fly creation of new tags if a `categoryDefId` is provided.
 */
export const TagInput = ({
  selectedTags,
  existingTags,
  categoryDefId,
  placeholder = 'Select tags...',
  popoverOpen,
  onTagsChange,
  onPopoverOpenChange,
}: TagInputProps) => {
  const { user } = useAuth();

  const [inputValue, setInputValue] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);

  // Handle controlled vs uncontrolled open state
  const isOpen = popoverOpen ?? internalOpen;
  const setOpen = onPopoverOpenChange ?? setInternalOpen;

  const handleSelect = useCallback(
    (tag: Tag) => {
      setInputValue('');
      // Prevent duplicates
      if (!selectedTags.some((t) => t.id === tag.id)) {
        onTagsChange([...selectedTags, tag]);
      }
      setOpen(false);
    },
    [selectedTags, onTagsChange, setOpen],
  );

  const handleUnselect = useCallback(
    (tagToRemove: Tag) => {
      onTagsChange(selectedTags.filter((tag) => tag.id !== tagToRemove.id));
    },
    [selectedTags, onTagsChange],
  );

  const handleCreate = useCallback(
    (tagName: string) => {
      if (!user || !categoryDefId) return;

      setInputValue('');

      // Create a temp tag object with a negative ID to signal it hasn't been persisted yet.
      // `handleTagSync` in useItemForm detects these via `t.id < 0`.
      const newTag: Tag = {
        id: -(Date.now() + Math.floor(Math.random() * 1000)),
        name: tagName.trim(),
        category_def_id: categoryDefId,
        user_id: user.id,
      };

      onTagsChange([...selectedTags, newTag]);
      setOpen(false);
    },
    [selectedTags, onTagsChange, user, categoryDefId, setOpen],
  );

  const searchLower = inputValue.trim().toLowerCase();

  // Filter existing tags based on search input
  const filteredTags = useMemo(() => {
    if (!existingTags.length) return [];
    return existingTags.filter(
      (tag) => !selectedTags.some((selected) => selected.id === tag.id) && tag.name.toLowerCase().includes(searchLower),
    );
  }, [existingTags, selectedTags, searchLower]);

  const showCreateOption = useMemo(() => {
    if (!searchLower || !categoryDefId) return false;
    const isExisting = existingTags.some((t) => t.name.toLowerCase() === searchLower);
    const isSelected = selectedTags.some((t) => t.name.toLowerCase() === searchLower);
    return !isExisting && !isSelected;
  }, [searchLower, categoryDefId, existingTags, selectedTags]);

  return (
    <Popover open={isOpen} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            'w-full justify-between h-auto min-h-[10px] py-2 px-3',
            selectedTags.length === 0 && 'text-muted-foreground font-normal',
          )}
        >
          <div className="flex gap-2 flex-wrap items-center">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} className="pr-1">
                  <span
                    role="button"
                    aria-label={`Remove ${tag.name}`}
                    className="ml-1 rounded-full outline-none text-muted-foreground/70 hover:text-foreground focus:ring-2 focus:ring-ring"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnselect(tag);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </TagBadge>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          {selectedTags.length === 0 && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search or create tag..." value={inputValue} onValueChange={setInputValue} />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>

            {/* CREATE OPTION */}
            {showCreateOption && (
              <CommandGroup>
                <CommandItem onSelect={() => handleCreate(inputValue)} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </CommandItem>
              </CommandGroup>
            )}

            {/* EXISTING TAGS */}
            {filteredTags.length > 0 && (
              <CommandGroup heading="Suggestions">
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => handleSelect(tag)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedTags.some((t) => t.id === tag.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
