import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '../api/branches.api';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Branches = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const queryClient = useQueryClient();

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await branchesApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: branchesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      toast.success('Filial muvaffaqiyatli yaratildi');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => branchesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      toast.success('Filial muvaffaqiyatli yangilandi');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: branchesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      toast.success('Filial o\'chirildi');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Haqiqatan ham bu filialni o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Filiallar</h1>
          <p className="text-gray-600 mt-1">Barcha o'quv markaz filiallari</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus />
          <span>Yangi filial</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches?.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <FiMapPin className="text-xl" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{branch.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{branch.address || 'Manzil kiritilmagan'}</p>

              <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                      ID: <span className="font-mono text-gray-700">{branch.id}</span>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <BranchModal
          isOpen={isModalOpen}
          onClose={closeModal}
          branch={editingBranch}
          onSubmit={(data) => {
            if (editingBranch) {
              updateMutation.mutate({ id: editingBranch.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      )}
    </div>
  );
};

const BranchModal = ({ isOpen, onClose, branch, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    address: branch?.address || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {branch ? 'Filialni tahrirlash' : 'Yangi filial'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomi
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masalan: Chilonzor filiali"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manzil
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows="3"
              placeholder="Filial manzili..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Branches;
