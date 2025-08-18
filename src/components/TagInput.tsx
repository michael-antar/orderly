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

// These props are placeholders for now and will be made functional in the next commit.
type TagInputProps = {
    // selectedTags: Tag[];
    // availableTags: Tag[];
    // onTagsChange: (newTags: Tag[]) => void;
};

export const TagInput = ({}: TagInputProps) => {
    // Placeholder data for UI design
    const selectedTags = [{ id: 1, name: 'Italian' }];
    const availableTags = [
        { id: 2, name: 'Date Night' },
        { id: 3, name: 'Dinner' },
    ];

    return (
        <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Tags</Label>
            <div className="col-span-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-auto"
                        >
                            <div className="flex gap-2 flex-wrap">
                                {selectedTags.length > 0 ? (
                                    selectedTags.map((tag) => (
                                        <TagBadge
                                            key={tag.id}
                                            name={tag.name}
                                        />
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
                        <Command>
                            <CommandInput placeholder="Search or create tag..." />
                            <CommandList>
                                <CommandEmpty>
                                    No results found. Type to create.
                                </CommandEmpty>
                                <CommandGroup heading="Suggestions">
                                    {availableTags.map((tag) => (
                                        <CommandItem key={tag.id}>
                                            {tag.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
