import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiUserCheck, 
  FiGrid, 
  FiCreditCard, 
  FiDollarSign, 
  FiBarChart2,
  FiLogOut,
  FiX,
  FiMapPin,
  FiShield,
  FiBriefcase,
  FiShoppingBag
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome, roles: ['ADMIN'] },
    { path: '/students', label: 'O\'quvchilar', icon: FiUsers, roles: ['ADMIN'] },
    { path: '/teachers', label: 'O\'qituvchilar', icon: FiUserCheck, roles: ['ADMIN'] },
    { path: '/groups', label: 'Guruhlar', icon: FiGrid, roles: ['ADMIN'] },
    { path: '/payments', label: 'To\'lovlar', icon: FiCreditCard, roles: ['ADMIN'] },
    { path: '/salary', label: 'Maoshlar', icon: FiBriefcase, roles: ['ADMIN'] },
    { path: '/expenses', label: 'Xarajatlar', icon: FiDollarSign, roles: ['ADMIN'] },
    { path: '/product-sales', label: 'Tushumlar', icon: FiShoppingBag, roles: ['ADMIN'] },
    { path: '/branches', label: 'Filiallar', icon: FiMapPin, roles: ['SUPER_ADMIN'] },
    { path: '/users', label: 'Foydalanuvchilar', icon: FiShield, roles: ['SUPER_ADMIN'] },
    { path: '/reports', label: 'Hisobotlar', icon: FiBarChart2, roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">B</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Big Ideas LC</h2>
              <p className="text-xs text-gray-400">ERP System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center gap-3 px-6 py-3 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-r-4 border-white'
                    : 'hover:bg-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="cursor-pointer flex items-center gap-3 w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
          >
            <FiLogOut className="cursor-pointer h-5 w-5" />
            <span className="font-medium">Chiqish</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;