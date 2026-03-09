import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { ForgotPasswordForm } from './ForgotPasswordForm';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { UpdatePasswordForm } from './UpdatePasswordForm';

export type AuthView = 'login' | 'signup' | 'update-password' | 'forgot-password';

const titles = {
  login: 'Login',
  signup: 'Sign Up',
  'update-password': 'Update Password',
  'forgot-password': 'Forgot Password',
};

const descriptions = {
  login: 'Enter your credentials to access your account.',
  signup: 'Enter your details to create an account.',
  'update-password': 'Enter a new password for your account.',
  'forgot-password': 'Enter your email to receive a password reset link.',
};

export interface AuthModalProps {
  /** Trigger element to open the modal */
  children: React.ReactNode;
  defaultView: AuthView;
}

/**
 * Authentication modal that can switch between: Login, Sign Up, Password Reset, and Password Update flows.
 */
export const AuthModal = ({ children, defaultView }: AuthModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState(defaultView);

  // Reset view to default on dialog open
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setView(defaultView);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{titles[view]}</DialogTitle>
          <DialogDescription>{descriptions[view]}</DialogDescription>
        </DialogHeader>

        {view === 'login' && (
          <LoginForm
            onSuccess={() => setIsOpen(false)}
            onViewChange={() => setView('signup')}
            onForgotPasswordClick={() => setView('forgot-password')}
          />
        )}
        {view === 'signup' && <SignUpForm onSuccess={() => setIsOpen(false)} onViewChange={() => setView('login')} />}
        {view === 'update-password' && <UpdatePasswordForm onSuccess={() => setIsOpen(false)} />}
        {view === 'forgot-password' && (
          <ForgotPasswordForm onSuccess={() => setIsOpen(false)} onViewChange={() => setView('login')} />
        )}
      </DialogContent>
    </Dialog>
  );
};
