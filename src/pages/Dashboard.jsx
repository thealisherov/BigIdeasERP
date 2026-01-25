import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { FiUsers, FiUserCheck, FiCreditCard, FiTrendingUp, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 daqiqa cache
  });

  const statCards = [
    {
      title: 'Jami O\'quvchilar',
      value: stats?.totalStudents || '0',
      icon: FiUsers,
      bgColor: 'from-blue-500 to-blue-600',
    },
    {
      title: 'O\'qituvchilar',
      value: stats?.totalTeachers || '0',
      icon: FiUserCheck,
      bgColor: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Oylik To\'lovlar',
      value: `${stats?.monthlyRevenue?.toLocaleString() || '0'} UZS`,
      icon: FiCreditCard,
      bgColor: 'from-green-500 to-green-600',
    },
    {
      title: 'Umumiy Daromad',
      value: `${stats?.totalRevenue?.toLocaleString() || '0'} UZS`,
      icon: FiTrendingUp,
      bgColor: 'from-orange-500 to-orange-600',
    },
  ];

  const quickActions = [
    { label: 'Yangi O\'quvchi', path: '/students', icon: FiPlus },
    { label: 'Yangi Guruh', path: '/groups', icon: FiPlus },
    { label: 'To\'lov Qabul Qilish', path: '/payments', icon: FiCreditCard },
    { label: 'Hisobot Ko\'rish', path: '/reports', icon: FiTrendingUp },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tizim ko'rsatkichlari</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))
        ) : (
          statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${card.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Tez Harakatlar
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <action.icon className="h-6 w-6 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">{action.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
