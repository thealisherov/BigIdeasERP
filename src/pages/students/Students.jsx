import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../api/students.api';
import { groupsApi } from '../../api/groups.api';
import { formatDate } from '../../api/helpers';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const MONTHS = [
  { value: 1, label: 'Yanvar' },
  { value: 2, label: 'Fevral' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Aprel' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Iyun' },
  { value: 7, label: 'Iyul' },
  { value: 8, label: 'Avgust' },
  { value: 9, label: 'Sentabr' },
  { value: 10, label: 'Oktabr' },
  { value: 11, label: 'Noyabr' },
  { value: 12, label: 'Dekabr' },
];

const Students = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    parentPhoneNumber: '',
    paymentDayOfMonth: ''
  });

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await studentsApi.getAll();
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
    setSelectedMonth(new Date().getMonth() + 1);
    if (student) {
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        phoneNumber: student.phoneNumber || '',
        parentPhoneNumber: student.parentPhoneNumber || '',
        paymentDayOfMonth: student.paymentDayOfMonth || ''
      });
    } else {
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        parentPhoneNumber: '',
        paymentDayOfMonth: ''
      });
    }
    setIsModalOpen(true);
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

  const getDaysInMonth = (month) => {
    const year = new Date().getFullYear();
    return new Date(year, month, 0).getDate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.parentPhoneNumber.trim()) {
      setFormError('Ota-ona telefon raqami shart');
      toast.error('Ota-ona telefon raqami shart');
      return;
    }

    if (formData.paymentDayOfMonth && (formData.paymentDayOfMonth < 1 || formData.paymentDayOfMonth > 31)) {
        setFormError("To'lov sanasi 1 va 31 oralig'ida bo'lishi kerak");
        toast.error("To'lov sanasi 1 va 31 oralig'ida bo'lishi kerak");
        return;
    }
    
    setFormError('');
    
    try {
      const payload = {
        ...formData,
        paymentDayOfMonth: formData.paymentDayOfMonth ? Number(formData.paymentDayOfMonth) : null
      };

      if (editingStudent) {
        await updateMutation.mutateAsync({ id: editingStudent.id, data: payload });
        toast.success("O'quvchi muvaffaqiyatli yangilandi");
      } else {
        await createMutation.mutateAsync(payload);
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


  const filteredStudents = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return students.filter(student =>
      student.firstName?.toLowerCase().includes(lower) ||
      student.lastName?.toLowerCase().includes(lower)
    );
  }, [students, searchTerm]);


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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guruh</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link to={`/students/${student.id}`} className="hover:text-blue-600 transition-colors">
                          {student.firstName} {student.lastName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.groups && student.groups.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {student.groups.map((g, idx) => (
                            <Link key={idx} to={`/groups/${g.id}`} className="flex flex-col bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 p-2 rounded-lg transition-colors group">
                               <span className="text-[13px] font-bold text-blue-700 group-hover:text-blue-800 transition-colors inline-block max-w-[150px] truncate" title={g.name}>{g.name}</span>
                               <span className="text-[11px] text-gray-500 mt-0.5"><span className="font-medium text-gray-700">O'qituvchi:</span> <span className="inline-block max-w-[100px] truncate align-bottom" title={g.teacherName || "Noma'lum"}>{g.teacherName || "Noma'lum"}</span></span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Guruhsiz</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link to={`/students/${student.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleOpenModal(student)} className="cursor-pointer p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

          <div className="grid grid-cols-1 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To'lov sanasi (Har oyning nechinchi kuni?)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  placeholder="Masalan: 5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.paymentDayOfMonth}
                  onChange={(e) => setFormData({ ...formData, paymentDayOfMonth: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">O'quvchining "Keyingi to'lov" muddati (End date) aynan shu raqamdan avtomatik hisoblanadi (masalan, 5-sana)</p>
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
