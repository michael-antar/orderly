import { ArrowDown, SlidersHorizontal } from 'lucide-react';

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

export const SortControls = () => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={'outline'}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Sort & Filter
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
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rating">Elo</SelectItem>
                                    <SelectItem value="name">
                                        Alphabetical
                                    </SelectItem>
                                    <SelectItem value="created_at">
                                        Date Added
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon">
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
