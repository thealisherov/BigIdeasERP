import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '../api/teachers.api';
import { teacherSalariesApi } from '../api/teacher-salaries.api';
import { getUserBranchId, formatCurrency } from '../api/helpers';
import { FiDollarSign, FiCalendar, FiUser, FiCheck, FiX } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Salary = () => {
  const queryClient = useQueryClient();
  
  // Hozirgi vaqtni olish
  const currentDate = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });
  
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [description, setDescription] = useState('');

  // Fetch all teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await teachersApi.getAll();
      return res.data;
    }
  });

  // Fetch salary calculations for all teachers
  const { data: salaryCalcs = [], isLoading: salaryLoading } = useQuery({
    queryKey: ['branchSalaries', selectedPeriod],
    queryFn: async () => {
      const branchId = getUserBranchId();
      const res = await teacherSalariesApi.calculateByBranch(branchId, selectedPeriod);
      return res.data;
    }
  });

  // Create salary payment mutation
  const paymentMutation = useMutation({
    mutationFn: (data) => teacherSalariesApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['branchSalaries']);
      queryClient.invalidateQueries(['salaryHistory']);
      setIsSalaryModalOpen(false);
      setSelectedTeacher(null);
      setPaymentAmount('');
      setDescription('');
      toast.success('Maosh to\'landi');
    },
    onError: (error) => {
      console.error('Error paying salary:', error);
      toast.error('Xatolik yuz berdi');
    }
  });

  const handleOpenPaymentModal = (teacher, calculatedSalary) => {
    setSelectedTeacher(teacher);
    setPaymentAmount(calculatedSalary.totalSalary || '');
    setDescription(`${teacher.firstName} ${teacher.lastName} - ${selectedPeriod.month}/${selectedPeriod.year} maosh`);
    setIsSalaryModalOpen(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const branchId = getUserBranchId();
    paymentMutation.mutate({
      teacherId: selectedTeacher.id,
      amount: parseFloat(paymentAmount),
      description,
      year: selectedPeriod.year,
      month: selectedPeriod.month,
      branchId: branchId ? Number(branchId) : null
    });
  };

  // Calculate totals
  const totalSalaries = salaryCalcs.reduce((sum, calc) => sum + (calc.totalSalary || 0), 0);
  const totalPaid = salaryCalcs.reduce((sum, calc) => sum + (calc.alreadyPaid || 0), 0);
  const totalRemaining = salaryCalcs.reduce((sum, calc) => sum + (calc.remainingAmount || 0), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">O'qituvchilar Maoshlari</h1>
        <p className="text-gray-600 mt-1">Oylik maosh hisob-kitobi va to'lovlar</p>
      </div>

      {/* Period Selector & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiCalendar className="text-blue-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-2">Davr</p>
          <div className="flex gap-2">
            <select
              value={selectedPeriod.month}
              onChange={(e) => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm cursor-pointer"
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}-oy</option>
              ))}
            </select>
            <select
              value={selectedPeriod.year}
              onChange={(e) => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm cursor-pointer"
            >
              <option value={currentDate.getFullYear() - 1}>{currentDate.getFullYear() - 1}</option>
              <option value={currentDate.getFullYear()}>{currentDate.getFullYear()}</option>
              <option value={currentDate.getFullYear() + 1}>{currentDate.getFullYear() + 1}</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiDollarSign className="text-purple-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Jami Maosh</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSalaries)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiCheck className="text-green-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-1">To'langan</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiX className="text-red-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Qoldiq</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">O'qituvchi</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Maosh Turi</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Talabalar</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Jami Maosh</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">To'langan</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Qoldiq</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salaryLoading || teachersLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : salaryCalcs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">Ma'lumot topilmadi</td>
                </tr>
              ) : (
                salaryCalcs.map((calc) => {
                  const teacher = teachers.find(t => t.id === calc.teacherId);
                  const isFullyPaid = calc.remainingAmount <= 0;
                  
                  return (
                    <tr key={calc.teacherId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {calc.teacherName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{calc.teacherName}</p>
                            <p className="text-xs text-gray-500">{calc.branchName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          teacher?.salaryType === 'FIXED' ? 'bg-blue-100 text-blue-800' :
                          teacher?.salaryType === 'PERCENTAGE' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {teacher?.salaryType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <p className="font-bold">{calc.totalStudents}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(calc.totalStudentPayments)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{formatCurrency(calc.totalSalary)}</p>
                          {calc.baseSalary > 0 && calc.paymentBasedSalary > 0 && (
                            <p className="text-xs text-gray-500">
                              {formatCurrency(calc.baseSalary)} + {formatCurrency(calc.paymentBasedSalary)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        {formatCurrency(calc.alreadyPaid)}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600">
                        {formatCurrency(calc.remainingAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {isFullyPaid ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">To'liq</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Qisman</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenPaymentModal(teacher, calc)}
                          className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          To'lash
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title={`Maosh to'lash: ${selectedTeacher?.firstName} ${selectedTeacher?.lastName}`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">Davr: <span className="font-bold text-gray-900">{selectedPeriod.month}/{selectedPeriod.year}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summa (UZS)</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsSalaryModalOpen(false)}
              className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={paymentMutation.isLoading}
              className="cursor-pointer px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {paymentMutation.isLoading ? 'Yuklanmoqda...' : 'To\'lash'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Salary;