import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Tags, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { TagBadge } from './TagBadge';
import { Separator } from './ui/separator';

import { type Category, categoryTitles, type Tag } from '@/types/types';

type TagManagementModal = {
    category: Category;
};

export const TagManagementModal = ({ category }: TagManagementModal) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch user tags for category
    useEffect(() => {
        const fetchTags = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('tags')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('category', category)
                    .order('name', { ascending: true });

                if (error) throw error;
                setTags(data || []);
            } catch (error) {
                console.error('Error fetching tags:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchTags();
        }
    }, [isOpen, user, category]);

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

                <Separator />

                {/* Display Tags */}
                <div className="py-4 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <p className="text-sm text-center text-muted-foreground">
                            Loading tags...
                        </p>
                    ) : tags.length > 0 ? (
                        <ul className="space-y-2">
                            {tags.map((tag) => (
                                <li
                                    key={tag.id}
                                    className="flex items-center justify-between"
                                >
                                    <TagBadge name={tag.name} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground">
                            No tags found for this category.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
