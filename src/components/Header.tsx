import { useState } from 'react';
import { UserProfile } from './UserProfile';
import { Button } from './ui/button';

export const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="relative flex justify-end p-4 bg-background border-b border-border">
        <Button onClick={() => setIsProfileOpen(!isProfileOpen)}>
            Account
        </Button>
      {isProfileOpen && <UserProfile onClose={() => setIsProfileOpen(false)} />}
    </header>
  );
};