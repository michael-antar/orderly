import { UserProfile } from './UserProfile';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';

type HeaderProps = {
    onMenuClick: () => void;
};

export const Header = ({ onMenuClick }: HeaderProps) => {

    return (
        <header className="relative flex items-center justify-between p-4 bg-background border-b border-border">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={onMenuClick}
                >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open sidebar</span>
                </Button>
                <div className="flex items-baseline gap-4">
                    <h1 className="text-3xl font-bold">Orderly</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Log and rank your experiences.
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <UserProfile />
            </div>
        </header>
    );  
};