import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { groupsApi } from '../api/groups.api';
import { teachersApi } from '../api/teachers.api';
import { formatCurrency } from '../api/helpers';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiClock, FiArrowRight, FiSearch } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Groups = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(''); // Qidiruv uchun state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '', teacherId: '', startTime: '', endTime: '',
    daysOfWeek: [], price: '', description: '', teacherSalaryPerStudent: ''
  });

  const { data: groups = [], isLoading: loading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await groupsApi.getAll();
      return response.data;
    },
  });

  // Qidiruv filtri
  const filteredGroups = useMemo(() => {
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await teachersApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      toast.success("Guruh yaratildi");
    },
    onError: (error) => {
      console.error("Guruh yaratishda xatolik:", error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      toast.success("Guruh yangilandi");
    },
    onError: (error) => {
      console.error("Guruh yangilashda xatolik:", error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => groupsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groups']),
  });

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        teacherId: group.teacherId,
        startTime: group.startTime || '',
        endTime: group.endTime || '',
        daysOfWeek: group.daysOfWeek || [],
        price: group.price || '',
        description: group.description || '',
        teacherSalaryPerStudent: group.teacherSalaryPerStudent || ''
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '', teacherId: '', startTime: '', endTime: '',
        daysOfWeek: [], price: '', description: '', teacherSalaryPerStudent: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        teacherSalaryPerStudent: parseFloat(formData.teacherSalaryPerStudent),
        teacherId: Number(formData.teacherId)
      };

      if (editingGroup) {
        await updateMutation.mutateAsync({ id: editingGroup.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Formani saqlashda catch xatosi:", error);
      // Toast xabar mutation onError da chiqadi, lekin bu yerda ham qolishi mumkin agar mutation ishlamasa
      if (!error.response) {
          toast.error('Xatolik yuz berdi');
      }
    }
  };

  const handleDelete = async (id) => {
    const group = groups.find(g => g.id === id);
    let confirmMessage = "Haqiqatan ham bu guruhni o'chirmoqchimisiz?";
    if (group?.studentCount > 0) {
      confirmMessage = `DIQQAT: Guruhda ${group.studentCount} ta o'quvchi bor! Baribir o'chirilsinmi?`;
    }

    if (window.confirm(confirmMessage)) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Guruh o'chirildi");
      } catch (error) {
        toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
      }
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header & Search Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Guruhlar</h1>
            <p className="text-gray-500 text-sm mt-1">O'quv markazi guruhlarini boshqarish</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 w-full sm:w-auto justify-center font-semibold text-sm"
          >
            <FiPlus /> Yangi Guruh Qo'shish
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Guruh nomi yoki o'qituvchi bo'yicha qidirish..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400">Yuklanmoqda...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400">
            {searchTerm ? "Hech narsa topilmadi" : "Guruhlar mavjud emas"}
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col hover:shadow-xl transition-all duration-300">
              
              {/* Card Top: Mobile da Faqat Nomi va Action Buttons qoladi */}
              <div className="flex justify-between items-center md:items-start mb-2 md:mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex w-12 h-12 bg-blue-50 rounded-xl items-center justify-center">
                    <FiUsers className="text-blue-600 w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-1">{group.name}</h3>
                </div>
                
                {/* Desktop Action Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(group)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body: Mobile da yashiriladi */}
              <div className="hidden md:flex flex-col flex-grow">
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {group.description || 'Izoh mavjud emas'}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-blue-600 font-bold text-lg">{formatCurrency(group.price)}</span>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                    <FiUsers size={12}/> {group.studentCount || 0} o'quvchi
                  </div>
                </div>

                <div className="space-y-2 py-4 border-t border-gray-50 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-gray-400">Ustoz:</span>
                    <span className="font-medium text-gray-800">{group.teacherName || 'Tanlanmagan'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-gray-400">Vaqti:</span>
                    <span className="font-medium text-gray-800">{group.startTime} - {group.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-gray-400">Kunlar:</span>
                    <span className="font-medium text-gray-800">
                      {group.daysOfWeek?.map(day => {
                        const daysMap = {
                          'MONDAY': 'Du', 'TUESDAY': 'Se', 'WEDNESDAY': 'Chor',
                          'THURSDAY': 'Pay', 'FRIDAY': 'Ju', 'SATURDAY': 'Sha', 'SUNDAY': 'Yak'
                        };
                        return daysMap[day] || day;
                      }).join(', ') || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: Mobile va Desktop da birdek ko'rinadi */}
              <div className="mt-2 md:mt-4">
                <Link
                  to={`/groups/${group.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-2.5 md:py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all group text-sm md:text-base"
                >
                  Batafsil
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Add/Edit - O'zgarishsiz qoldi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? "Guruhni Tahrirlash" : "Yangi Guruh Yaratish"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Guruh nomi</label>
              <input
                type="text" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">O'qituvchi tanlang</label>
              <select
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              >
                <option value="">O'qituvchini tanlang</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Narxi (so'm)</label>
              <input
                type="number" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">O'qituvchi ulushi (bir o'quvchi uchun)</label>
              <input
                type="number" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.teacherSalaryPerStudent}
                onChange={(e) => setFormData({ ...formData, teacherSalaryPerStudent: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hafta kunlari</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'MONDAY', label: 'Du' },
                  { value: 'TUESDAY', label: 'Se' },
                  { value: 'WEDNESDAY', label: 'Chor' },
                  { value: 'THURSDAY', label: 'Pay' },
                  { value: 'FRIDAY', label: 'Ju' },
                  { value: 'SATURDAY', label: 'Sha' },
                  { value: 'SUNDAY', label: 'Yak' }
                ].map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      const newDays = formData.daysOfWeek.includes(day.value)
                        ? formData.daysOfWeek.filter(d => d !== day.value)
                        : [...formData.daysOfWeek, day.value];
                      setFormData({ ...formData, daysOfWeek: newDays });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Boshlash</label>
                <input
                  type="text" placeholder="09:00"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tugash</label>
                <input
                  type="text" placeholder="10:30"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Groups;