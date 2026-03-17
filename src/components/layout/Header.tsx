import { Menu } from 'lucide-react';

import Logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';

import { UserProfile } from '../auth/UserProfile';
import { ThemeToggle } from './ThemeToggle';

type HeaderProps = {
  activeCategoryName?: string;
  onMenuClick: () => void;
};

/**
 * Global top navigation bar.
 * Contains the mobile menu toggle, active category breadcrumb, and user profile controls.
 */
export const Header = ({ activeCategoryName, onMenuClick }: HeaderProps) => {
  return (
    <header className="relative flex items-center justify-between p-3 bg-background border-b border-border">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>

        {/* Logo + Breadcrumb */}
        <div className="flex items-end gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <img src={Logo} alt="Orderly Logo" className="w-8 h-8" />
            Orderly
          </h1>
          {activeCategoryName ? (
            <span className="text-xl text-foreground font-medium">{activeCategoryName}</span>
          ) : (
            <p className="text-sm text-muted-foreground hidden sm:block">Log and rank your experiences.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserProfile />
      </div>
    </header>
  );
};
