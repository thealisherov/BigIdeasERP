import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { studentsApi } from '../api/students.api';
import { Link } from 'react-router-dom';
import { getUserBranchId, formatCurrency, formatDate } from '../api/helpers';
import { FiPlus, FiSearch, FiCreditCard, FiDollarSign, FiEdit2, FiTrash2, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import PaymentHistoryModal from './PaymentHistoryModal';
import { PAYMENT_STATUS } from '../utils/constants';

const Payments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
 
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Kalendar filter
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // paymentDate - oyning birinchi kuni (YYYY-MM-DD)
  const getDefaultPaymentDate = useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }, []);

  const [formData, setFormData] = useState({
    studentId: '',
    groupId: '',
    amount: '',
    description: '',
    paymentDate: getDefaultPaymentDate(),
    paymentDueDate: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const { data: payments = [], isLoading: loading } = useQuery({
    queryKey: ['payments', selectedYear, selectedMonth],
    queryFn: async () => {
      const branchId = getUserBranchId();
      if (!branchId) return [];

      try {
        // Barcha o'quvchilarni to'lov holati bilan olish
        const response = await studentsApi.getAll({ year: selectedYear, month: selectedMonth });
        return response.data;
      } catch (error) {
        console.warn("To'lov ma'lumotlarini olishda xatolik:", error);
        return [];
      }
    },
  });

  const [studentGroups, setStudentGroups] = useState([]);

  const handleStudentChange = useCallback(async (studentId) => {
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
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => paymentsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries(['payments']),
  });

  const handleOpenModal = (student = null) => {
    let initialDueDate = '';
    const pDate = getDefaultPaymentDate();
    
    if (student) {
      const paymentDay = student?.paymentDayOfMonth || 1;
      if (pDate) {
        const [year, month] = pDate.split('-');
        const lastDayObj = new Date(year, month, 0);
        const lastDay = lastDayObj.getDate();
        const validDay = Math.min(paymentDay, lastDay);
        initialDueDate = `${year}-${month}-${String(validDay).padStart(2, '0')}`;
      }
      
      setEditingPayment(null);
      setFormData({
        studentId: student.id,
        groupId: '',
        amount: student.remainingAmount || '',
        description: '',
        paymentDate: pDate,
        paymentDueDate: initialDueDate
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
        paymentDate: pDate,
        paymentDueDate: ''
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
            paymentDate: formData.paymentDate,
            paymentDueDate: formData.paymentDueDate,
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




  // Statusni avtomatik aniqlash — useCallback bilan optimizatsiya
  const getComputedStatus = useCallback((student) => {
      const remaining = Number(student.remainingAmount) || 0;
      
      // 1. Agar qarz bo'lmasa -> PAID
      if (remaining <= 0) return PAYMENT_STATUS.PAID;
      
      // 2. Agar sana o'tib ketgan bo'lsa -> OVERDUE
      const dueDateStr = student.nextDueDate || student.paymentDueDate || student.dueDate;
      if (dueDateStr) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const due = new Date(dueDateStr);
          due.setHours(0, 0, 0, 0);
          
          if (due < today) {
              return PAYMENT_STATUS.OVERDUE;
          }
      }

      // 3. Agar backenddan aniq status kelsa va u PAID/PARTIAL bo'lsa
      if (student.paymentStatus === PAYMENT_STATUS.PAID || student.paymentStatus === PAYMENT_STATUS.PARTIAL) {
          return student.paymentStatus;
      }
      
      // 4. Qolgan barcha holatlarda (agar qarzi bo'lsa va muddati o'tmagan bo'lsa) -> UNPAID
      return PAYMENT_STATUS.UNPAID;
  }, []);

  // useMemo — faqat payments, searchTerm yoki statusFilter o'zgarganda qayta hisoblanadi
  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return payments.filter(student => {
      const matchesSearch =
        (student.firstName?.toLowerCase() || '').includes(searchLower) ||
        (student.lastName?.toLowerCase() || '').includes(searchLower) ||
        (student.phoneNumber || '').includes(searchLower);

      if (!matchesSearch) return false;

      if (statusFilter !== 'ALL') {
          return getComputedStatus(student) === statusFilter;
      }

      return true;
    });
  }, [payments, searchTerm, statusFilter, getComputedStatus]);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
            <h1 className="text-2xl font-bold text-gray-800">To'lovlar</h1>
            <p className="text-gray-600 mt-1">O'quvchilar to'lov holati</p>
            </div>
            <button
            onClick={() => handleOpenModal()}
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
            <FiPlus /> Yangi To'lov
            </button>
        </div>

        {/* Kalendar filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
               <FiCalendar className="text-blue-600" />
               <button
                 type="button"
                 onClick={() => {
                   if (selectedMonth === 1) {
                     setSelectedMonth(12);
                     setSelectedYear(prev => prev - 1);
                   } else {
                     setSelectedMonth(prev => prev - 1);
                   }
                 }}
                 className="cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors"
               >
                 <FiChevronLeft className="w-4 h-4" />
               </button>
               <select
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(Number(e.target.value))}
                 className="px-2 py-1 border-0 bg-transparent font-medium text-gray-800 cursor-pointer focus:outline-none"
               >
                 {[
                   { v: 1, l: 'Yanvar' }, { v: 2, l: 'Fevral' }, { v: 3, l: 'Mart' },
                   { v: 4, l: 'Aprel' }, { v: 5, l: 'May' }, { v: 6, l: 'Iyun' },
                   { v: 7, l: 'Iyul' }, { v: 8, l: 'Avgust' }, { v: 9, l: 'Sentabr' },
                   { v: 10, l: 'Oktabr' }, { v: 11, l: 'Noyabr' }, { v: 12, l: 'Dekabr' }
                 ].map(m => (
                   <option key={m.v} value={m.v}>{m.l}</option>
                 ))}
               </select>
               <select
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(Number(e.target.value))}
                 className="px-2 py-1 border-0 bg-transparent font-medium text-gray-800 cursor-pointer focus:outline-none"
               >
                 {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                   <option key={y} value={y}>{y}</option>
                 ))}
               </select>
               <button
                 type="button"
                 onClick={() => {
                   if (selectedMonth === 12) {
                     setSelectedMonth(1);
                     setSelectedYear(prev => prev + 1);
                   } else {
                     setSelectedMonth(prev => prev + 1);
                   }
                 }}
                 className="cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors"
               >
                 <FiChevronRight className="w-4 h-4" />
               </button>
               {(selectedYear !== new Date().getFullYear() || selectedMonth !== new Date().getMonth() + 1) && (
                 <button
                   type="button"
                   onClick={() => {
                     setSelectedYear(new Date().getFullYear());
                     setSelectedMonth(new Date().getMonth() + 1);
                   }}
                   className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                 >
                   Bugun
                 </button>
               )}
             </div>

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
                 <option value={PAYMENT_STATUS.PAID}>To'liq to'lagan</option>
                 <option value={PAYMENT_STATUS.PARTIAL}>Qisman to'lagan</option>
                 <option value={PAYMENT_STATUS.UNPAID}>To'lamagan</option>
             </select>
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
                filteredData.map((student) => {
                  const computedStatus = getComputedStatus(student);
                  return (
                  <tr key={student.id} className={`transition-colors ${(computedStatus === PAYMENT_STATUS.OVERDUE || computedStatus === PAYMENT_STATUS.UNPAID) ? 'bg-red-200 hover:bg-red-300' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link to={`/students/${student.id}`} className="hover:text-blue-600 transition-colors">
                        {student.firstName} {student.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {student.phoneNumber}
                    </td>
                     <td className="px-6 py-4 text-sm text-gray-500">
                      {student.groupName || (student.groups?.map(g => g.name).join(', ') || '-')}
                    </td>
                     <td className="px-6 py-4">
                       {(() => {
                         const dDate = student.nextDueDate || student.paymentDueDate || student.dueDate;
                         if (!dDate) return <span className="text-gray-400">-</span>;
                         try {
                           const end = new Date(dDate);
                           const start = new Date(dDate);
                           start.setMonth(start.getMonth() - 1);
                           
                           return (
                             <div className={`inline-flex flex-col gap-0.5 p-2 rounded-xl border transition-all duration-300 ${
                               computedStatus === PAYMENT_STATUS.OVERDUE 
                                 ? 'bg-red-50 border-red-100 text-red-700 shadow-sm' 
                                 : 'bg-blue-50/50 border-blue-100/50 text-blue-700'
                             }`}>
                               <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">
                                 <FiCalendar className="w-3 h-3" />
                                 <span>To'lov davri</span>
                               </div>
                               <div className="flex items-center gap-2 text-[13px] font-medium whitespace-nowrap">
                                 <span className="opacity-60">{formatDate(start)}</span>
                                 <span className="w-1 h-3 bg-current opacity-20 rounded-full"></span>
                                 <span className="font-bold">{formatDate(end)}</span>
                               </div>
                             </div>
                           );
                         } catch (e) {
                           return <span className="text-gray-500 font-medium">{formatDate(dDate)}</span>;
                         }
                       })()}
                     </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      {formatCurrency(student.totalPaidInMonth || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                      {formatCurrency(student.remainingAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                       {computedStatus === PAYMENT_STATUS.PAID && <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-medium">To'liq</span>}
                       {computedStatus === PAYMENT_STATUS.PARTIAL && <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-medium">Qisman</span>}
                       {computedStatus === PAYMENT_STATUS.UNPAID && <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-medium">To'lamagan</span>}
                       {computedStatus === PAYMENT_STATUS.UPCOMING && <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-medium">Kutilmoqda</span>}
                       {computedStatus === PAYMENT_STATUS.OVERDUE && <span className="text-red-800 bg-red-200 px-2 py-1 rounded text-xs font-medium">Muddati o'tgan</span>}
                    </td>
                     <td className="px-6 py-4 text-sm">
                       <div className="flex gap-2">
                         {/* UNPAID, UPCOMING, OVERDUE holatlarida to'lov tugmasi */}
                         {[PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.UPCOMING, PAYMENT_STATUS.OVERDUE].includes(student.paymentStatus) || (!student.paymentStatus && student.remainingAmount > 0) ? (
                           <button
                             onClick={() => handleOpenModal(student)}
                             className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                           >
                             To'lov qilish
                           </button>
                         ) : (
                           /* PAID yoki PARTIAL bo'lsa edit/delete */
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
                );
              })
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
              onChange={(e) => {
                 const sId = e.target.value;
                 handleStudentChange(sId);
                 if (sId && formData.paymentDate) {
                    const student = payments.find(s => s.id === Number(sId));
                    if (student) {
                      const paymentDay = student.paymentDayOfMonth || 1;
                      const [year, month] = formData.paymentDate.split('-');
                      const lastDayObj = new Date(year, month, 0);
                      const validDay = Math.min(paymentDay, lastDayObj.getDate());
                      const calcDueDate = `${year}-${month}-${String(validDay).padStart(2, '0')}`;
                      setFormData(prev => ({...prev, paymentDueDate: calcDueDate}));
                    }
                 }
              }}
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
                  {group.name} - {formatCurrency(group.tuitionFee || group.price)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish sanasi</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.paymentDate}
                  onChange={(e) => {
                    const newPaymentDate = e.target.value;
                    
                    setFormData(prev => {
                      let newDueDate = prev.paymentDueDate;
                      if (newPaymentDate && prev.studentId) {
                        const student = payments.find(s => s.id === Number(prev.studentId));
                        if (student) {
                          const paymentDay = student.paymentDayOfMonth || 1;
                          const [year, month] = newPaymentDate.split('-');
                          const lastDayObj = new Date(year, month, 0);
                          const validDay = Math.min(paymentDay, lastDayObj.getDate());
                          newDueDate = `${year}-${month}-${String(validDay).padStart(2, '0')}`;
                        }
                      }
                      return { ...prev, paymentDate: newPaymentDate, paymentDueDate: newDueDate };
                    });
                  }}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tugash sanasi (muddati)</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData({ ...formData, paymentDueDate: e.target.value })}
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
                         if (group) setFormData({...formData, amount: group.tuitionFee || group.price});
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