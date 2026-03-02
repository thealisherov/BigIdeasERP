import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses.api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiArrowDown } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import { getUserBranchId } from '../api/helpers';

const Expenses = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'OTHER'
  });

  const { data: expenses = [], isLoading: loading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await expensesApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => expensesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries(['expenses']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expensesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['expenses']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => expensesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['expenses']),
  });

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        amount: expense.amount,
        description: expense.description || '',
        category: expense.category || 'OTHER'
      });
    } else {
      setEditingExpense(null);
      setFormData({
        amount: '',
        description: '',
        category: 'OTHER'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        branchId: getUserBranchId()
      };

      if (payload.branchId) {
          payload.branchId = Number(payload.branchId);
      }

      if (editingExpense) {
        await updateMutation.mutateAsync({ id: editingExpense.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Haqiqatan ham bu xarajatni o\'chirmoqchimisiz?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Xarajatlar</h1>
          <p className="text-gray-600 mt-1">Barcha chiqimlar ro'yxati</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className=" cursor-pointer bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors w-full sm:w-auto justify-center"
        >
          <FiPlus /> Yangi Xarajat
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sana</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kategoriya</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Summa</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Izoh</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Xarajatlar topilmadi</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                      -{expense.amount?.toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(expense)}
                          className="cursor-pointer p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="cursor-pointer p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? "Xarajatni tahrirlash" : "Yangi xarajat"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summa (UZS)</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="RENT">Ijara (RENT)</option>
              <option value="UTILITIES">Kommunal (UTILITIES)</option>
              <option value="SUPPLIES">Ta'minot (SUPPLIES)</option>
              <option value="MAINTENANCE">Tamirlash (MAINTENANCE)</option>
              <option value="OTHER">Boshqa (OTHER)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
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
              className="cursor-pointer px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
