import { FiBell, FiSettings, FiUser, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <FiMenu className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {/* Dynamic Title could go here based on route */}
            Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
         
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.branchName || 'Branch'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username ? user.username.charAt(0).toUpperCase() : <FiUser className="h-5 w-5" />}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
