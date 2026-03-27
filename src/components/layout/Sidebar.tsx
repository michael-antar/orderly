import { X } from 'lucide-react';

import Logo from '@/assets/logo.svg';
import { UserProfile } from '@/components/auth/UserProfile';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CategoryDefinition } from '@/types/types';

import { CategoryManager } from '../categories/CategoryManager';
import { ThemeToggle } from './ThemeToggle';

type SidebarProps = {
  categories: CategoryDefinition[];
  activeCategoryId: string | null;
  isSidebarOpen: boolean;
  isLoading: boolean;
  onCategorySelect: (id: string) => void;
  onCategoriesChange: () => void;
  /** Mobile Only: Triggered to close the mobile drawer. */
  onClose: () => void;
};

/**
 * Main side navigation for category selection.
 * Collapsible drawer on mobile - fixed icon-rail on desktop
 */
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
        'fixed top-0 left-0 h-full w-72 bg-background px-4 pb-4 border-r border-border transition-transform duration-300 ease-in-out z-40',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:static md:w-14 md:p-2 md:translate-x-0 md:z-auto',
        'flex flex-col',
      )}
    >
      {/* Mobile Sidebar Header */}
      <div className="flex items-center justify-between py-4 md:hidden">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="Orderly Logo" className="w-7 h-7" />
          <span className="text-xl font-black tracking-tight">Orderly</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      {/* Nav list */}
      <nav className="flex flex-col gap-1 md:gap-2 flex-1">
        <TooltipProvider delayDuration={300}>
          {isLoading
            ? // Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full md:h-10 md:w-10 md:mx-auto rounded-md" />
              ))
            : categories.map((cat) => (
                <Tooltip key={cat.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeCategoryId === cat.id ? 'secondary' : 'ghost'}
                      className={cn(
                        'justify-start w-full min-h-[44px] md:min-h-0',
                        'md:w-10 md:h-10 md:justify-center md:p-0', // Icon-only on desktop
                      )}
                      onClick={() => onCategorySelect(cat.id)}
                    >
                      <DynamicIcon name={cat.icon} className="h-5 w-5 shrink-0" />
                      <span className="ml-3 truncate md:hidden">{cat.name}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="hidden md:block">
                    {cat.name}
                  </TooltipContent>
                </Tooltip>
              ))}
        </TooltipProvider>
      </nav>

      <div className="mt-auto pt-4 border-t">
        {/* Mobile: Theme toggle and User Profile */}
        <div className="flex items-center gap-2 mb-3 md:hidden">
          <ThemeToggle />
          <UserProfile />
        </div>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <CategoryManager categories={categories} onDataChange={onCategoriesChange} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden md:block">
              Manage Categories
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
};
