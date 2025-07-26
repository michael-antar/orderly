import { useAuth } from '../contexts/AuthContext';

import { User, AlertTriangle } from 'lucide-react';
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
                {isPermanent? (
                    <div className="px-2 py-1.5 text-sm">
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground truncate">{user?.email}</p>
                    </div>
                ) : (
                    <div className="p-2 text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>You're a guest. Sign up to save your data across devices.</p>
                    </div>
                )}
                    
                <div className="px-2 py-1.5 text-sm">
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-medium text-foreground truncate">{user?.id}</p>
                </div>
                <DropdownMenuSeparator />
                {isPermanent? (
                    <>
                        <AuthModal defaultView='update-password'>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Change Password
                            </DropdownMenuItem>
                        </AuthModal>
                        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            Sign Out
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <AuthModal defaultView='signup'>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Sign Up
                            </DropdownMenuItem>
                        </AuthModal>
                        <AuthModal defaultView='login'>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Log In
                            </DropdownMenuItem>
                        </AuthModal>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};