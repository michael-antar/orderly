import { UserProfile } from './UserProfile';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {

    return (
        <header className="relative flex justify-end p-4 bg-background border-b border-border">
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <UserProfile />
            </div>
        </header>
    );
};