import { UserProfile } from './UserProfile';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {

    return (
        <header className="relative flex items-center justify-between p-4 bg-background border-b border-border">
            <div className="flex items-baseline gap-4">
                <h1 className="text-3xl font-bold">Orderly</h1>
                <p className="text-sm text-muted-foreground">Log and rank your experiences.</p>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <UserProfile />
            </div>
        </header>
    );  
};