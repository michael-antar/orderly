import { useAuth } from '../contexts/AuthContext';

import { User } from 'lucide-react';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthModal } from './AuthModal';

export const UserProfile = () => {
    const { user, isPermanent, signOut } = useAuth();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <User className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm">
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium text-foreground">
                            {isPermanent ? 'Permanent' : 'Anonymous'}
                        </p>
                    </div>
                    <div className="px-2 py-1.5 text-sm">
                        <p className="text-muted-foreground">User ID</p>
                        <p className="font-medium text-foreground truncate">{user?.id}</p>
                    </div>
                <DropdownMenuSeparator />
                {isPermanent? (
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        Sign Out
                    </DropdownMenuItem>
                ) : (
                    <>
                        <AuthModal defaultView='login'>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Log In
                            </DropdownMenuItem>
                        </AuthModal>
                        <AuthModal defaultView='signup'>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Sign Up
                            </DropdownMenuItem>
                        </AuthModal>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};