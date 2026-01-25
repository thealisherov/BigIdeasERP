import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../api/students.api';
import { groupsApi } from '../../api/groups.api';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const Students = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    parentPhoneNumber: '',
    groupIds: []
  });

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await studentsApi.getAll();
      return response.data;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await groupsApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => studentsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries(['students']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => studentsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['students']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => studentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['students']),
  });

  const handleOpenModal = (student = null) => {
    setFormError('');
    if (student) {
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        phoneNumber: student.phoneNumber || '',
        parentPhoneNumber: student.parentPhoneNumber || '',
        groupIds: student.groups ? student.groups.map(g => g.id) : []
      });
    } else {
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        parentPhoneNumber: '',
        groupIds: []
      });
    }
    setIsModalOpen(true);
  };

  const toggleGroupSelection = (groupId) => {
    setFormData(prev => {
      const isSelected = prev.groupIds.includes(groupId);
      if (isSelected) {
        return { ...prev, groupIds: prev.groupIds.filter(id => id !== groupId) };
      } else {
        return { ...prev, groupIds: [...prev.groupIds, groupId] };
      }
    });
  };

  // Telefon raqam formatlash - +998 kiritish
  const formatPhoneNumber = (value) => {
    // Faqat raqamlarni qoldirish
    let numbers = value.replace(/\D/g, '');
    
    // Agar 998 bilan boshlanmasa va raqam bo'lsa
    if (numbers && !numbers.startsWith('998')) {
      // 9 bilan boshlangan bo'lsa, uni 998 ga almashtirish
      if (numbers.startsWith('9')) {
        numbers = '998' + numbers;
      } else {
        // Boshqalari uchun 998 qo'shish
        numbers = '998' + numbers;
      }
    }
    
    // +998 formatida qaytarish
    if (numbers.startsWith('998')) {
      return '+' + numbers;
    }
    
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.parentPhoneNumber.trim()) {
      setFormError('Ota-ona telefon raqami shart');
      toast.error('Ota-ona telefon raqami shart');
      return;
    }
    
    setFormError('');
    
    try {
      if (editingStudent) {
        await updateMutation.mutateAsync({ id: editingStudent.id, data: formData });
        toast.success("O'quvchi muvaffaqiyatli yangilandi");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("O'quvchi muvaffaqiyatli qo'shildi");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMsg = error.response?.data?.message || 'Xatolik yuz berdi';
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Haqiqatan ham bu o\'quvchini o\'chirmoqchimisiz?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("O'quvchi muvaffaqiyatli o'chirildi");
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
        const errorMessage = error.response?.data?.message || 'Xatolik yuz berdi';
        
        // Agar to'lovlar bilan bog'liq xatolik bo'lsa
        if (errorMessage.includes('constraint') || errorMessage.includes('payments')) {
          toast.error("Bu o'quvchining to'lovlari mavjud! O'chirishdan oldin uning to'lovlarini o'chiring.");
        } else {
          toast.error(errorMessage);
        }
      }
    }
  };

  const filteredStudents = students.filter(student =>
    student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">O'quvchilar</h1>
          <p className="text-gray-600 mt-1">Barcha o'quvchilar ro'yxati</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all w-full sm:w-auto"
        >
          <FiPlus className="h-5 w-5" />
          Yangi O'quvchi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="O'quvchi qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ism
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guruh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                     Yuklanmoqda...
                   </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.groups && student.groups.length > 0 ? student.groups.map(g => g.name).join(', ') : 'Guruhsiz'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Aktiv
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/students/${student.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenModal(student)}
                          className="cursor-pointer p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    O'quvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-semibold">❌ Xatolik:</p>
              <p>{formError}</p>
            </div>
          )}
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
              placeholder="+998 90 123 45 67"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: formatPhoneNumber(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ota-ona telefon raqami</label>
            <input
              type="text"
              placeholder="+998 90 123 45 67"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.parentPhoneNumber}
              onChange={(e) => setFormData({ ...formData, parentPhoneNumber: formatPhoneNumber(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Guruhlar</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {groups.map(group => (
                <div
                  key={group.id}
                  className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all ${
                    formData.groupIds.includes(group.id)
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                    formData.groupIds.includes(group.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.groupIds.includes(group.id) && <FiCheck className="text-white w-3 h-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.teacherName || 'O\'qituvchi yo\'q'}</p>
                  </div>
                </div>
              ))}
              {groups.length === 0 && <p className="text-sm text-gray-500 p-2">Guruhlar mavjud emas</p>}
            </div>
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
    </div>
  );
};

export default Students;
