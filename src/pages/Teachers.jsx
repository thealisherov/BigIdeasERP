import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { teachersApi } from '../api/teachers.api';
import { teacherSalariesApi } from '../api/teacher-salaries.api';
import { groupsApi } from '../api/groups.api';
import { getUserBranchId, formatCurrency } from '../api/helpers';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDollarSign, FiEye } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Teachers = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedTeacherForSalary, setSelectedTeacherForSalary] = useState(null);
  const [salaryFormData, setSalaryFormData] = useState({
    amount: '',
    description: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const { data: teachers = [], isLoading: loading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await teachersApi.getAll();
      return response.data;
    },
  });

  // Fetch all groups to count for each teacher
  const { data: allGroups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: async () => {
      const branchId = getUserBranchId();
      const response = await groupsApi.getAll({ branchId });
      return response.data;
    },
  });

  // Guruhlar va talabalar sonini hisoblash
  const getTeacherStats = (teacherId) => {
    const teacherGroups = allGroups.filter(g => g.teacherId === teacherId);
    const groupsCount = teacherGroups.length;
    const studentsCount = teacherGroups.reduce((sum, g) => sum + (g.studentCount || 0), 0);
    return { groupsCount, studentsCount };
  };

  const createMutation = useMutation({
    mutationFn: (data) => teachersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      queryClient.invalidateQueries(['allGroups']);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => teachersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      queryClient.invalidateQueries(['allGroups']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      queryClient.invalidateQueries(['allGroups']);
    },
  });

  const salaryPaymentMutation = useMutation({
    mutationFn: (data) => teacherSalariesApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      queryClient.invalidateQueries(['teacherSalaries']);
    },
  });

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phoneNumber: teacher.phoneNumber,
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '+998',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        branchId: getUserBranchId()
      };

      if (payload.branchId) {
          payload.branchId = Number(payload.branchId);
      }

      if (editingTeacher) {
        await updateMutation.mutateAsync({ id: editingTeacher.id, data: payload });
        toast.success("O'qituvchi muvaffaqiyatli yangilandi");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("O'qituvchi muvaffaqiyatli qo'shildi");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    const teacher = teachers.find(t => t.id === id);
    const stats = getTeacherStats(id);
    
    let confirmMessage = 'Haqiqatan ham bu o\'qituvchini o\'chirmoqchimisiz?';
    
    if (stats.groupsCount > 0) {
      confirmMessage = `DIQQAT: Bu o'qituvchida ${stats.groupsCount} ta guruh va ${stats.studentsCount} ta talaba mavjud!\n\nO'qituvchini o'chirish uchun avval:\n1. Guruhlarni boshqa o'qituvchiga tayinlang\n2. Yoki guruhlarni o'chiring\n\nDavom etasizmi?`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("O'qituvchi muvaffaqiyatli o'chirildi");
      } catch (error) {
        console.error('Error deleting teacher:', error);
        const errorMessage = error.response?.data?.message || 'Xatolik yuz berdi';
        toast.error(errorMessage);
        
        // Agar guruhlar mavjud bo'lsa, qo'shimcha ma'lumot
        if (errorMessage.includes('guruh')) {
          toast.error('Avval guruhlarni boshqa o\'qituvchiga tayinlang yoki o\'chiring', {
            duration: 5000
          });
        }
      }
    }
  };

  const handleOpenSalaryModal = (teacher) => {
    setSelectedTeacherForSalary(teacher);
    const today = new Date();
    setSalaryFormData({
      amount: '',
      description: `Maosh: ${teacher.firstName} ${teacher.lastName}`,
      year: today.getFullYear(),
      month: today.getMonth() + 1
    });
    setIsSalaryModalOpen(true);
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    try {
      const branchId = getUserBranchId();
      await salaryPaymentMutation.mutateAsync({
        teacherId: selectedTeacherForSalary.id,
        amount: parseFloat(salaryFormData.amount),
        description: salaryFormData.description,
        year: parseInt(salaryFormData.year),
        month: parseInt(salaryFormData.month),
        branchId: branchId ? Number(branchId) : null
      });
      setIsSalaryModalOpen(false);
      toast.success('To\'lov muvaffaqiyatli amalga oshirildi');
    } catch (error) {
      console.error('Error paying salary:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">O'qituvchilar</h1>
          <p className="text-gray-600 mt-1">O'qituvchilar va ularning maoshlari</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <FiPlus /> Yangi O'qituvchi
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`cursor-pointer px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'list'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('list')}
        >
          Ro'yxat
        </button>
        <button
          className={`cursor-pointer px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'salaries'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('salaries')}
        >
          Maoshlar Tarixi
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ism Familiya</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Telefon</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Guruhlar/Talabalar</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Yuklanmoqda...</td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">O'qituvchilar topilmadi</td>
                  </tr>
                ) : (
                  teachers.map((teacher) => {
                    const stats = getTeacherStats(teacher.id);
                    return (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{teacher.phoneNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>
                            <span className="font-bold">{stats.groupsCount}</span> guruh / <span className="font-bold">{stats.studentsCount}</span> talaba
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Link
                              to={`/teachers/${teacher.id}`}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Ko'rish"
                            >
                              <FiEye />
                            </Link>
                            <button
                              onClick={() => handleOpenSalaryModal(teacher)}
                              className="cursor-pointer p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Maosh to'lash"
                            >
                              <FiDollarSign />
                            </button>
                            <button
                              onClick={() => handleOpenModal(teacher)}
                              className="cursor-pointer p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDelete(teacher.id)}
                              className="cursor-pointer p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <SalaryHistory />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>



          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="cursor-pointer px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title={`Maosh to'lash: ${selectedTeacherForSalary?.firstName} ${selectedTeacherForSalary?.lastName}`}
      >
        <form onSubmit={handleSalarySubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
                <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={salaryFormData.year}
                onChange={(e) => setSalaryFormData({ ...salaryFormData, year: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oy</label>
                <input
                type="number"
                required
                min="1"
                max="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={salaryFormData.month}
                onChange={(e) => setSalaryFormData({ ...salaryFormData, month: e.target.value })}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summa (UZS)</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={salaryFormData.amount}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              rows="3"
              value={salaryFormData.description}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, description: e.target.value })}
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
              className="cursor-pointer px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              To'lash
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const SalaryHistory = () => {
    const queryClient = useQueryClient();
    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['salaryHistory'],
        queryFn: async () => {
             const branchId = getUserBranchId();
             const res = await teacherSalariesApi.getPaymentsByBranch(branchId);
             return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => teacherSalariesApi.deletePayment(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['salaryHistory']);
            queryClient.invalidateQueries(['teachers']);
            toast.success("To'lov o'chirildi");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Xatolik yuz berdi");
        }
    });

    const handleDelete = (id) => {
        if (window.confirm("Haqiqatan ham bu to'lovni o'chirmoqchimisiz?")) {
            deleteMutation.mutate(id);
        }
    };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sana</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">O'qituvchi</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Davr</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Summa</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Izoh</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Yuklanmoqda...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Maoshlar tarixi mavjud emas</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {payment.teacherName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                          {payment.month}/{payment.year}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                          {payment.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                          <button
                              onClick={() => handleDelete(payment.id)}
                              className="cursor-pointer text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                              title="O'chirish"
                          >
                              <FiTrash2 />
                          </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
    </div>
  );
};

export default Teachers;