import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { studentsApi } from '../api/students.api';
import { getUserBranchId, formatCurrency, formatDate } from '../api/helpers';
import { FiPlus, FiSearch, FiCreditCard, FiDollarSign, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import PaymentHistoryModal from './PaymentHistoryModal';

const Payments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
 
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    groupId: '',
    amount: '',
    description: '',
    paymentYear: new Date().getFullYear(),
    paymentMonth: new Date().getMonth() + 1
  });
  
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const { data: payments = [], isLoading: loading } = useQuery({
    queryKey: ['payments', searchTerm, statusFilter],
    queryFn: async () => {
      const branchId = getUserBranchId();
      if (!branchId) return [];

      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;

      try {
        const response = await studentsApi.getAll({ branchId, year, month });
        return response.data;
      } catch (error) {
        console.error("Error fetching students:", error);
        return [];
      }
    },
  });

  const [studentGroups, setStudentGroups] = useState([]);

  const handleStudentChange = async (studentId) => {
      setFormData(prev => ({ ...prev, studentId, groupId: '' }));
      if (studentId) {
          try {
              const response = await studentsApi.getGroups(studentId);
              setStudentGroups(response.data || []);
              if (response.data && response.data.length === 1) {
                   setFormData(prev => ({ ...prev, groupId: response.data[0].id }));
              }
          } catch (error) {
              console.error("Error fetching student groups", error);
              setStudentGroups([]);
          }
      } else {
          setStudentGroups([]);
      }
  };

  const createMutation = useMutation({
    mutationFn: (data) => paymentsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries(['payments']),
  });

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingPayment(null);
      setFormData({
        studentId: student.id,
        groupId: '',
        amount: student.remainingAmount || '',
        description: '',
        paymentYear: new Date().getFullYear(),
        paymentMonth: new Date().getMonth() + 1
      });
      setPaymentMethod('CASH');
      handleStudentChange(student.id);
    } else {
      setEditingPayment(null);
      setFormData({
        studentId: '',
        groupId: '',
        amount: '',
        description: '',
        paymentYear: new Date().getFullYear(),
        paymentMonth: new Date().getMonth() + 1
      });
      setPaymentMethod('CASH');
      setStudentGroups([]);
    }
    setIsModalOpen(true);
  };

  const handleOpenHistory = (student) => {
    setSelectedStudent(student);
    setIsHistoryOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            studentId: Number(formData.studentId),
            groupId: Number(formData.groupId),
            amount: parseFloat(formData.amount),
            description: formData.description || '',
            paymentYear: Number(formData.paymentYear),
            paymentMonth: Number(formData.paymentMonth),
            category: paymentMethod,
            branchId: getUserBranchId() ? Number(getUserBranchId()) : null
        };
        
        await createMutation.mutateAsync(payload);
        setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving payment:', error);
      console.error('Error response:', error.response?.data);
      alert('Xatolik yuz berdi: ' + (error.response?.data?.message || error.message));
    }
  };


  const filteredData = payments.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (student.firstName?.toLowerCase() || '').includes(searchLower) ||
        (student.lastName?.toLowerCase() || '').includes(searchLower) ||
        (student.phoneNumber || '').includes(searchLower);

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
          matchesStatus = student.paymentStatus === statusFilter;
      }

      let matchesDate = true;
      if (startDate || endDate) {
          const dueDate = student.nextDueDate;
          if (!dueDate) {
              matchesDate = false;
          } else {
              if (startDate && dueDate < startDate) matchesDate = false;
              if (endDate && dueDate > endDate) matchesDate = false;
          }
      }

      return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
            <h1 className="text-2xl font-bold text-gray-800">To'lovlar</h1>
            <p className="text-gray-600 mt-1">O'quvchilar to'lov holati (Joriy oy)</p>
            </div>
            <button
            onClick={() => handleOpenModal()}
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
            <FiPlus /> Yangi To'lov
            </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="O'quvchi qidirish (ism, telefon)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
             </div>
             <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             >
                 <option value="ALL">Barcha holatlar</option>
                 <option value="PAID">To'liq to'lagan</option>
                 <option value="PARTIAL">Qisman to'lagan</option>
                 <option value="UNPAID">To'lamagan</option>
                 <option value="UPCOMING">Kutilmoqda</option>
                 <option value="OVERDUE">Muddati o'tgan</option>
             </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
             <span className="text-gray-600 font-medium flex items-center gap-2">
                <FiCalendar /> Muddat:
             </span>
             <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
             />
             <span className="text-gray-400">-</span>
             <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
             />
             {(startDate || endDate) && (
                <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    Tozalash
                </button>
             )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">O'quvchi</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Guruhlar</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">To'lov muddati</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">To'lagan</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Qarzdorlik</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Ma'lumot topilmadi</td>
                </tr>
              ) : (
                filteredData.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {student.phoneNumber}
                    </td>
                     <td className="px-6 py-4 text-sm text-gray-500">
                      {student.groupName || (student.groups?.map(g => g.name).join(', ') || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(student.nextDueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      {formatCurrency(student.totalPaidInMonth || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                      {formatCurrency(student.remainingAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                       {student.paymentStatus === 'PAID' && <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">To'liq</span>}
                       {student.paymentStatus === 'PARTIAL' && <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs">Qisman</span>}
                       {student.paymentStatus === 'UNPAID' && <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs">To'lamagan</span>}
                       {student.paymentStatus === 'UPCOMING' && <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs">Kutilmoqda</span>}
                       {student.paymentStatus === 'OVERDUE' && <span className="text-red-800 bg-red-200 px-2 py-1 rounded text-xs">Muddati o'tgan</span>}

                       {/* Fallback */}
                       {!student.paymentStatus && student.remainingAmount > 0 && <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs">To'lamagan</span>}
                       {!student.paymentStatus && student.remainingAmount === 0 && <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">To'liq</span>}
                    </td>
                     <td className="px-6 py-4 text-sm">
                       <div className="flex gap-2">
                         {/* Agar umuman to'lamagan bo'lsa faqat to'lov qilish buttoni */}
                         {(student.paymentStatus === 'UNPAID' || student.totalPaidInMonth === 0) ? (
                           <button
                             onClick={() => handleOpenModal(student)}
                             className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                           >
                             To'lov qilish
                           </button>
                         ) : (
                           /* Agar to'liq yoki qisman to'lagan bo'lsa edit va delete buttonlari */
                           <>
                             <button
                               onClick={() => handleOpenHistory(student)}
                               className="cursor-pointer bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                               title="Tahrirlash"
                             >
                               <FiEdit2 className="w-3 h-3" />
                               Edit
                             </button>
                             <button
                               onClick={() => handleOpenHistory(student)}
                               className="cursor-pointer bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
                               title="O'chirish"
                             >
                               <FiTrash2 className="w-3 h-3" />
                               Delete
                             </button>
                           </>
                         )}
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
        title="To'lov qilish"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">O'quvchi</label>
            <select
              required
              disabled={!!formData.studentId && payments.some(p => p.id === formData.studentId)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
              value={formData.studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              <option value="">Tanlang</option>
              {payments.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guruh</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.groupId}
              onChange={(e) => {
                  setFormData({ ...formData, groupId: e.target.value });
              }}
            >
              <option value="">Tanlang</option>
              {studentGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} - {formatCurrency(group.price)}
                </option>
              ))}
            </select>
          </div>

          {/* TO'LOV USULI - Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">To'lov usuli</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 flex-1"
                     style={{
                       borderColor: paymentMethod === 'CASH' ? '#3b82f6' : '#d1d5db',
                       backgroundColor: paymentMethod === 'CASH' ? '#eff6ff' : 'transparent'
                     }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <FiDollarSign className="text-green-600 text-xl" />
                <span className="font-medium text-gray-700">Naqd</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 flex-1"
                     style={{
                       borderColor: paymentMethod === 'CARD' ? '#3b82f6' : '#d1d5db',
                       backgroundColor: paymentMethod === 'CARD' ? '#eff6ff' : 'transparent'
                     }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <FiCreditCard className="text-blue-600 text-xl" />
                <span className="font-medium text-gray-700">Karta</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
                <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.paymentYear}
                onChange={(e) => setFormData({ ...formData, paymentYear: e.target.value })}
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
                value={formData.paymentMonth}
                onChange={(e) => setFormData({ ...formData, paymentMonth: e.target.value })}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summa (UZS)</label>
            <div className="flex gap-2 mb-2">
                <button
                    type="button"
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded cursor-pointer hover:bg-green-200 transition-colors"
                    onClick={() => {
                         const group = studentGroups.find(g => g.id === Number(formData.groupId));
                         if (group) setFormData({...formData, amount: group.price});
                    }}
                >
                    To'liq to'lov
                </button>
            </div>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
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
              className="cursor-pointer px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>

      <PaymentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        studentId={selectedStudent?.id}
        studentName={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
        onRefresh={() => queryClient.invalidateQueries(['payments'])}
      />
    </div>
  );
};

export default Payments;