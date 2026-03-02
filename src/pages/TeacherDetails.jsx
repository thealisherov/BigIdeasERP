import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '../api/teachers.api';
import { teacherSalariesApi } from '../api/teacher-salaries.api';
import { groupsApi } from '../api/groups.api';
import { formatCurrency } from '../api/helpers';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiPhone,
  FiMail,
  FiDollarSign,
  FiCalendar,
  FiBook,
  FiArrowLeft,
  FiTrendingUp,
  FiTrash2
} from 'react-icons/fi';

const TeacherDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  // Hozirgi vaqtni olish
  const currentDate = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });

  // Fetch teacher data
  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      const res = await teachersApi.getById(id);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch teacher's groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['teacherGroups', id],
    queryFn: async () => {
      const res = await groupsApi.getByTeacher(id);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch salary calculation for selected period
  const { data: salaryCalc, isLoading: salaryLoading } = useQuery({
    queryKey: ['teacherSalary', id, selectedPeriod],
    queryFn: async () => {
      const res = await teacherSalariesApi.calculateByTeacher(id, selectedPeriod);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch salary history
  const { data: salaryHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['teacherSalaryHistory', id],
    queryFn: async () => {
      const res = await teacherSalariesApi.getHistoryByTeacher(id);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch individual payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['teacherPayments', id],
    queryFn: async () => {
      const res = await teacherSalariesApi.getPaymentsByTeacher(id);
      return res.data;
    },
    enabled: !!id
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId) => teacherSalariesApi.deletePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherPayments', id]);
      queryClient.invalidateQueries(['teacherSalaryHistory', id]);
      queryClient.invalidateQueries(['teacherSalary', id]);
      toast.success("To'lov o'chirildi");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi");
    }
  });

  const handleDeletePayment = (paymentId) => {
    if (window.confirm("Haqiqatan ham bu to'lovni o'chirmoqchimisiz?")) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

  if (teacherLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!teacher) {
    return <div className="p-6 text-center text-gray-500">O'qituvchi topilmadi</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Link
        to="/teachers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <FiArrowLeft /> O'qituvchilarga qaytish
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {teacher.firstName?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {teacher.firstName} {teacher.lastName}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FiPhone className="text-gray-400" />
              <span>{teacher.phoneNumber || 'Telefon kiritilmagan'}</span>
            </div>
            {teacher.email && (
              <div className="flex items-center gap-3 text-gray-600">
                <FiMail className="text-gray-400" />
                <span>{teacher.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-600">
              <FiCalendar className="text-gray-400" />
              <span>
                Qo'shilgan: {new Date(teacher.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Salary Calculation Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiDollarSign className="text-green-600" />
                Maosh Hisob-kitobi
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPeriod.month}
                  onChange={(e) => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm cursor-pointer"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}-oy</option>
                  ))}
                </select>
                <select
                  value={selectedPeriod.year}
                  onChange={(e) => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm cursor-pointer"
                >
                  <option value={currentDate.getFullYear() - 1}>{currentDate.getFullYear() - 1}</option>
                  <option value={currentDate.getFullYear()}>{currentDate.getFullYear()}</option>
                  <option value={currentDate.getFullYear() + 1}>{currentDate.getFullYear() + 1}</option>
                </select>
              </div>
            </div>

            {salaryLoading ? (
              <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
            ) : salaryCalc ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Asosiy maosh</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(salaryCalc.baseSalary)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Jami Tushum</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(salaryCalc.totalStudentPayments || 0)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Foizdan (Ulush)</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(salaryCalc.paymentBasedSalary)}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Jami maosh</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(salaryCalc.totalSalary)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">To'langan</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(salaryCalc.alreadyPaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Qoldiq</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(salaryCalc.remainingAmount)}</p>
                  </div>
                </div>

                {salaryCalc.groups && salaryCalc.groups.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Guruhlar bo'yicha</h4>
                    <div className="space-y-2">
                      {salaryCalc.groups.map(group => (
                        <div key={group.groupId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{group.groupName}</p>
                            <p className="text-xs text-gray-500">{group.studentCount} ta o'quvchi to'lagan</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(group.totalGroupPayments)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Ma'lumot topilmadi</div>
            )}
          </div>

          {/* Groups Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBook className="text-blue-600" />
              Guruhlar ({groups.length})
            </h3>

            {groupsLoading ? (
              <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{group.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{group.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">{group.studentCount || 0} ta o'quvchi</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Guruhlar topilmadi</p>
            )}
          </div>

          {/* Salary History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-purple-600" />
              Maosh Tarixi
            </h3>

            {historyLoading ? (
              <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
            ) : salaryHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Davr</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Jami maosh</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">To'langan</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {salaryHistory.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{item.month}/{item.year}</td>
                        <td className="px-4 py-3 text-sm font-bold">{formatCurrency(item.totalSalary)}</td>
                        <td className="px-4 py-3 text-sm text-green-600 font-bold">{formatCurrency(item.totalPaid)}</td>
                        <td className="px-4 py-3 text-sm">
                          {item.isFullyPaid ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">To'liq</span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Qisman</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Maosh tarixi mavjud emas</p>
            )}
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="text-green-600" />
              To'lovlar Ro'yxati
            </h3>

            {paymentsLoading ? (
              <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Sana</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Summa</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Davr</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Izoh</th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{payment.month}/{payment.year}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{payment.description || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="cursor-pointer text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                            title="O'chirish"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">To'lovlar mavjud emas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetails;