import { useState } from 'react';
import { UserProfile } from './UserProfile';

export const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="relative flex justify-end p-4 bg-white border-b border-gray-200">
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Account
      </button>

      {isProfileOpen && <UserProfile onClose={() => setIsProfileOpen(false)} />}
    </header>
  );
};