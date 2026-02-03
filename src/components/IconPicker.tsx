import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { DynamicIcon, ICON_OPTIONS } from './DynamicIcon';

type IconPickerProps = {
    selectedIcon: string;
    onChange: (newIcon: string) => void;
};

export const IconPicker = ({ selectedIcon, onChange }: IconPickerProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between px-3 font-normal"
                >
                    <div className="flex items-center gap-2">
                        {/* Currently selected icon */}
                        <DynamicIcon
                            name={selectedIcon}
                            className="h-4 w-4 text-primary"
                        />
                        <span className="capitalize">{selectedIcon}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search icon..." />
                    <CommandList>
                        <CommandEmpty>No icon found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {ICON_OPTIONS.map((iconKey) => (
                                <CommandItem
                                    key={iconKey}
                                    value={iconKey}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue);
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            selectedIcon === iconKey
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    <DynamicIcon
                                        name={iconKey}
                                        className="mr-2 h-4 w-4 text-muted-foreground"
                                    />
                                    <span className="capitalize">
                                        {iconKey}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
