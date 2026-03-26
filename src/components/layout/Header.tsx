import { ChevronRight } from 'lucide-react';

import Logo from '@/assets/logo.svg';

import { UserProfile } from '../auth/UserProfile';
import { ThemeToggle } from './ThemeToggle';

type HeaderProps = {
  activeCategoryName?: string;
  onMenuClick: () => void;
};

/**
 * Global top navigation bar.
 * Mobile: compact tappable category name that opens the sidebar.
 * Desktop: full logo + breadcrumb + profile/theme controls.
 */
export const Header = ({ activeCategoryName, onMenuClick }: HeaderProps) => {
  return (
    <header className="relative flex items-center justify-between p-2 px-3 md:p-3 bg-background border-b border-border">
      {/* Mobile: Tappable area to open sidebar */}
      <button
        className="flex items-center gap-1.5 min-w-0 min-h-[44px] rounded-lg px-2 -mx-1 md:hidden active:bg-accent transition-colors"
        onClick={onMenuClick}
      >
        <img src={Logo} alt="Orderly Logo" className="w-8 h-8" />
        <span className="text-lg font-semibold truncate">{activeCategoryName || 'Orderly'}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Desktop: Logo + Breadcrumb */}
      <div className="hidden md:flex items-end gap-4 min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight shrink-0">
          <img src={Logo} alt="Orderly Logo" className="w-8 h-8" />
          <span>Orderly</span>
        </h1>
        {activeCategoryName ? (
          <span className="text-xl text-foreground font-medium truncate">{activeCategoryName}</span>
        ) : (
          <p className="text-sm text-muted-foreground">Log and rank your experiences.</p>
        )}
      </div>

      {/* Desktop only: Profile & Theme */}
      <div className="hidden md:flex items-center gap-4">
        <ThemeToggle />
        <UserProfile />
      </div>
    </header>
  );
};
