import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../pages/auth/Login';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import Students from '../pages/students/Students';
import StudentDetails from '../pages/students/StudentDetails';
import Teachers from '../pages/Teachers';
import TeacherDetails from '../pages/TeacherDetails';
import Groups from '../pages/Groups';
import GroupDetails from '../pages/groups/GroupDetails';
import Payments from '../pages/Payments';
import Expenses from '../pages/Expenses';
import Salary from '../pages/Salary';
import Reports from '../pages/Reports';
import ProductSales from '../pages/ProductSales';
import NotFound from '../pages/NotFound';
import Users from '../pages/Users';
import UserDetails from '../pages/UserDetails';
import Branches from '../pages/Branches';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

const RoleProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (user && allowedRoles.includes(user.role)) {
    return element;
  }
  
  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ruxsat yo'q</h1>
          <p className="text-gray-600 mb-6">Sizga bu sahifaga kirish ruxsati yo'q</p>
          <a 
            href="/users" 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Foydalanuvchilar bo'limiga qaytish
          </a>
        </div>
      </div>
    );
  }
  
  return <Navigate to="/dashboard" replace />;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/users" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        index: true,
        element: <RootRedirect />,
      },
      {
        path: 'dashboard',
        element: <RoleProtectedRoute element={<Dashboard />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'students',
        element: <RoleProtectedRoute element={<Students />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'students/:id',
        element: <RoleProtectedRoute element={<StudentDetails />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'teachers',
        element: <RoleProtectedRoute element={<Teachers />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'teachers/:id',
        element: <RoleProtectedRoute element={<TeacherDetails />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'groups',
        element: <RoleProtectedRoute element={<Groups />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'groups/:id',
        element: <RoleProtectedRoute element={<GroupDetails />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'payments',
        element: <RoleProtectedRoute element={<Payments />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'expenses',
        element: <RoleProtectedRoute element={<Expenses />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'salary',
        element: <RoleProtectedRoute element={<Salary />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'product-sales',
        element: <RoleProtectedRoute element={<ProductSales />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'reports',
        element: <RoleProtectedRoute element={<Reports />} allowedRoles={['ADMIN', 'SUPER_ADMIN']} />,
      },
      {
        path: 'users',
        element: <RoleProtectedRoute element={<Users />} allowedRoles={['SUPER_ADMIN']} />,
      },
      {
        path: 'users/:id',
        element: <RoleProtectedRoute element={<UserDetails />} allowedRoles={['SUPER_ADMIN']} />,
      },
      {
        path: 'branches',
        element: <RoleProtectedRoute element={<Branches />} allowedRoles={['SUPER_ADMIN']} />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;