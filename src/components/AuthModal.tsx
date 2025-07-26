import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { LoginForm } from './login-form';
import { SignUpForm } from './sign-up-form';

type AuthModalProps = {
    children: React.ReactNode;
    defaultView: 'login' | 'signup';
};

export const AuthModal = ({ children, defaultView }: AuthModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState(defaultView);

    // Reset view to default on dialog open
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            setView(defaultView)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogHeader className='sr-only'>
                <DialogTitle>{view === 'login' ? 'Log In' : 'Sign Up'}</DialogTitle>
                <DialogDescription>
                    {view === 'login'
                        ? 'Enter your credentials to access your account.'
                        : 'Enter your details to create an account.'
                    }
                </DialogDescription>
            </DialogHeader>
            <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-none shadow-none">
                {view === 'login' ? (
                    <LoginForm
                        onSuccess={() => setIsOpen(false)}
                        onViewChange={() => setView('signup')}
                    />
                ) : (
                    <SignUpForm
                        onSuccess={() => setIsOpen(false)}
                        onViewChange={() => setView('login')}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};