import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { DynamicIcon } from '@/components/DynamicIcon';
import { CategoryManager } from './CategoryManager';

import type { CategoryDefinition } from '@/types/types';

type SidebarProps = {
    categories: CategoryDefinition[];
    activeCategoryId: string | null;
    isSidebarOpen: boolean;
    isLoading: boolean;
    onCategorySelect: (id: string) => void;
    onCategoriesChange: () => void;
    onClose: () => void; // Mobile-only
};

export const Sidebar = ({
    categories,
    activeCategoryId,
    isSidebarOpen,
    isLoading,
    onCategorySelect,
    onCategoriesChange,
    onClose,
}: SidebarProps) => {
    return (
        <aside
            className={cn(
                'fixed top-0 left-0 h-full w-64 bg-background px-4 pb-4 pt-[65px] border-r border-border transition-transform duration-300 ease-in-out z-20',
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
                'md:static md:w-14 md:p-2 md:translate-x-0',
                'flex flex-col',
            )}
        >
            {/* Mobile Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 md:hidden"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
                <span className="sr-only">Close sidebar</span>
            </Button>

            {/* Nav list */}
            <nav className="flex flex-col gap-2">
                {isLoading
                    ? // Skeleton
                      Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton
                              key={i}
                              className="h-10 w-full md:w-10 md:mx-auto rounded-md"
                          />
                      ))
                    : categories.map((cat) => (
                          <Button
                              key={cat.id}
                              variant={
                                  activeCategoryId === cat.id
                                      ? 'secondary'
                                      : 'ghost'
                              }
                              className={cn(
                                  'justify-start w-full',
                                  'md:w-10 md:h-10 md:justify-center md:p-0', // Icon-only on desktop
                              )}
                              onClick={() => onCategorySelect(cat.id)}
                              title={cat.name}
                          >
                              <DynamicIcon
                                  name={cat.icon}
                                  className="h-5 w-5 shrink-0"
                              />
                              <span className="ml-3 truncate md:hidden">
                                  {cat.name}
                              </span>
                          </Button>
                      ))}
            </nav>

            <div className="mt-auto pt-4 border-t">
                <CategoryManager
                    categories={categories}
                    onDataChange={onCategoriesChange}
                />
            </div>
        </aside>
    );
};
