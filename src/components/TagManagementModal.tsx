import { useState } from 'react';

import { Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { type Category, categoryTitles } from '@/types/types';

type TagManagementModal = {
    category: Category;
};

export const TagManagementModal = ({ category }: TagManagementModal) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Tags className="h-4 w-4" />
                    <span className="sr-only">Manage Tags</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Manage {categoryTitles[category]} Tags
                    </DialogTitle>
                    <DialogDescription>
                        Here you can rename or delete your custom tags for this
                        category.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {/* Tag list and delete functionality will go here in the next commits */}
                    <p className="text-sm text-center text-muted-foreground">
                        Tag management is coming soon.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
