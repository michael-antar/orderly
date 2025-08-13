import { ArrowDown } from 'lucide-react';

import { Button } from './ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const SortControls = () => {
    return (
        <div className="flex items-center gap-2">
            <Select>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="rating">Elo</SelectItem>
                    <SelectItem value="name">Alphabetical</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="ghost" size="icon">
                <ArrowDown className="h-4 w-4" />
            </Button>
        </div>
    );
};
