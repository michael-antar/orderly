import { useAuth } from '../contexts/AuthContext';

type UserProfileProps = {
  onClose: () => void;
};

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const { user, isPermanent, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  return (
    <div className="absolute top-full right-0 z-10 w-56 p-4 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
      <div className="mb-4">
        <p className="text-sm text-gray-500">User ID:</p>
        <p className="text-sm font-medium text-gray-800 truncate">{user?.id}</p>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-500">Status:</p>
        <p className="text-sm font-medium text-gray-800">
          {isPermanent ? 'Permanent' : 'Anonymous'}
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};