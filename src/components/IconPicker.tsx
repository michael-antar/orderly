import { useState, useMemo } from 'react';
import { ChevronsUpDown, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ICON_OPTIONS } from '@/lib/icons';
import { DynamicIcon } from './DynamicIcon';

type IconPickerProps = {
    id?: string;
    selectedIcon: string;
    onChange: (newIcon: string) => void;
};

export const IconPicker = ({ id, selectedIcon, onChange }: IconPickerProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Based on search input
    const filteredIcons = useMemo(() => {
        if (!search) return ICON_OPTIONS;
        return ICON_OPTIONS.filter((icon) =>
            icon.toLowerCase().includes(search.toLowerCase()),
        );
    }, [search]);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
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

            <PopoverContent className="w-[340px] p-0" align="start">
                <div className="flex flex-col h-[300px]">
                    {/* Search Header */}
                    <div className="flex items-center border-b px-3 pb-2 pt-3 gap-1">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                            placeholder="Search icon..."
                            className="flex h-8 w-full rounded-md bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Scrollable Grid Area */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredIcons.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No icon found.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 justify-between">
                                {filteredIcons.map((iconKey) => (
                                    <button
                                        key={iconKey}
                                        onClick={() => {
                                            onChange(iconKey);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            // Layout & Base Styles
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors',
                                            // Interactive States
                                            'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                            // Selected State
                                            selectedIcon === iconKey
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-transparent bg-transparent',
                                        )}
                                        title={iconKey}
                                        type="button"
                                    >
                                        <DynamicIcon
                                            name={iconKey}
                                            className="h-5 w-5"
                                        />
                                        <span className="sr-only">
                                            {iconKey}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
