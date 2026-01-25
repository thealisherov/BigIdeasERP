import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../api/groups.api';
import { studentsApi } from '../../api/students.api';
import { attendanceApi } from '../../api/attendance.api';
import { formatCurrency, getUserBranchId } from '../../api/helpers';
import {
  FiUsers,
  FiClock,
  FiDollarSign,
  FiUserPlus,
  FiTrash2,
  FiArrowLeft,
  FiCalendar,
  FiMessageSquare,
  FiSearch,
  FiCheckCircle
} from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const GroupDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  // Hozirgi vaqtni olish
  const currentDate = new Date();
  const [selectedDate, setSelectedDate] = useState({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
  });

  // Add Student Modal State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  // GroupDetails.jsx da attendanceDate to'g'ri formatda bo'lishi kerak
const [attendanceDate, setAttendanceDate] = useState(
  new Date().toISOString().split('T')[0] // "YYYY-MM-DD" format
);
  const [attendanceList, setAttendanceList] = useState({}); // { studentId: status }

  // Student Attendance History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);

  // Fetch group data with selected period
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id, selectedDate],
    queryFn: async () => {
      const res = await groupsApi.getById(id, selectedDate.year, selectedDate.month);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch all students for the "Add Student" dropdown
  const { data: allStudents = [] } = useQuery({
      queryKey: ['allStudents'],
      queryFn: async () => {
          const res = await studentsApi.getAll();
          return res.data;
      },
      enabled: isAddStudentModalOpen
  });

  // Add student mutation
  const addStudentMutation = useMutation({
      mutationFn: ({ groupId, studentId }) => groupsApi.addStudent(groupId, studentId),
      onSuccess: () => {
          queryClient.invalidateQueries(['group', id]);
          setIsAddStudentModalOpen(false);
          setSelectedStudentId('');
          setStudentSearchTerm('');
          toast.success("O'quvchi guruhga qo'shildi");
      },
      onError: (err) => {
          console.error("Error adding student:", err);
          toast.error(err.response?.data?.message || "Xatolik yuz berdi");
      }
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
      mutationFn: ({ groupId, studentId }) => groupsApi.removeStudent(groupId, studentId),
      onSuccess: () => {
          queryClient.invalidateQueries(['group', id]);
          toast.success("O'quvchi guruhdan olib tashlandi");
      },
      onError: (err) => {
          console.error("Error removing student:", err);
          toast.error(err.response?.data?.message || "Xatolik yuz berdi");
      }
  });

  const handleAddStudent = (e) => {
      e.preventDefault();
      if (!selectedStudentId) return;
      addStudentMutation.mutate({ groupId: id, studentId: selectedStudentId });
  };

  const handleRemoveStudent = (studentId) => {
      if (window.confirm("Haqiqatan ham bu o'quvchini guruhdan olib tashlamoqchimisiz?")) {
          removeStudentMutation.mutate({ groupId: id, studentId });
      }
  };

  const attendanceMutation = useMutation({
    mutationFn: (data) => attendanceApi.markBulk(data),
    onSuccess: () => {
      toast.success("Davomat saqlandi");
      queryClient.invalidateQueries(['attendance', id, attendanceDate]);
      setIsAttendanceModalOpen(false);
    },
    onError: (err) => {
      console.error("Error marking attendance:", err);
      toast.error("Davomatni saqlashda xatolik yuz berdi");
      console.error("Backend error details:", err.response?.data);
      toast.error(err.response?.data?.message || "Davomatni saqlashda xatolik yuz berdi");
    }
  });

  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', id, attendanceDate],
    queryFn: async () => {
       try {
         const res = await attendanceApi.getByGroupAndDate(id, attendanceDate);
         return res.data;
       } catch (err) {
         return [];
       }
    },
    enabled: !!id && !!attendanceDate
  });

  // Load existing attendance into state when data arrives
  React.useEffect(() => {
    if (existingAttendance && group?.studentPayments) {
      const initialAttendance = {};

      // Default all to ABSENT if not found, or load existing
      group.studentPayments.forEach(student => {
        const record = existingAttendance.find(a => a.studentId === student.studentId);
        initialAttendance[student.studentId] = record ? record.status : 'ABSENT';
        // Note: Logic above assumes we want to default to ABSENT or PRESENT.
        // Usually default is PRESENT. Let's make default PRESENT.
        if (!record) initialAttendance[student.studentId] = 'PRESENT';
      });

      setAttendanceList(initialAttendance);
    } else if (group?.studentPayments) {
        // Initialize all as PRESENT
        const initialAttendance = {};
        group.studentPayments.forEach(student => {
            initialAttendance[student.studentId] = 'PRESENT';
        });
        setAttendanceList(initialAttendance);
    }
  }, [existingAttendance, group, isAttendanceModalOpen]);

 const handleAttendanceSubmit = () => {
  const attendances = Object.entries(attendanceList).map(
    ([studentId, status]) => ({
      studentId: Number(studentId),
      status
    })
  );

  const payload = {
    branchId: Number(getUserBranchId()),
    groupId: Number(id),
    attendanceDate: attendanceDate,
    attendances
  };

  console.log("Yuborilayotgan payload:", payload);
  attendanceMutation.mutate(payload);
};

  const handleOpenAttendanceModal = () => {
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setIsAttendanceModalOpen(true);
  };

  const handleOpenHistoryModal = async (student) => {
      setSelectedStudentForHistory(student);
      setIsHistoryModalOpen(true);
      try {
          const res = await attendanceApi.getStudentAttendanceByMonth(
              student.studentId,
              id,
              selectedDate.year,
              selectedDate.month
          );
          setStudentHistory(res.data || []);
      } catch (error) {
          console.error("Error fetching student history:", error);
          setStudentHistory([]);
      }
  };

  const handleSendAbsentSms = (student) => {
      const phone = student.parentPhoneNumber || student.phoneNumber;
      if (!phone) {
          toast.error("Telefon raqam topilmadi");
          return;
      }

      // SMS havolasi uchun raqamdagi bo'sh joylarni olib tashlash
      const cleanPhone = phone.replace(/\s/g, '');
      const message = `Assalomu alaykum. ${student.studentName} bugun darsga qatnashmadi.`;
      const encodedMessage = encodeURIComponent(message);
      
      window.location.href = `sms:${cleanPhone}?body=${encodedMessage}`;
  };

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return <div className="p-6 text-center text-gray-500">Guruh topilmadi</div>;
  }

  // Calculate statistics
  const studentPayments = group.studentPayments || [];
  const totalStudents = studentPayments.length;
  const paidStudents = studentPayments.filter(s => s.paymentStatus === 'PAID').length;
  const partialStudents = studentPayments.filter(s => s.paymentStatus === 'PARTIAL').length;
  const unpaidStudents = studentPayments.filter(s => s.paymentStatus === 'UNPAID').length;
  
  const totalRevenue = studentPayments.reduce((sum, s) => sum + (s.totalPaidInMonth || 0), 0);
  const expectedRevenue = totalStudents * (group.price || 0);
  const remainingRevenue = expectedRevenue - totalRevenue;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <Link to="/groups" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
        <FiArrowLeft /> Guruhlarga qaytish
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
                <p className="text-gray-600 mb-4">{group.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <FiUsers className="text-blue-500" />
                        <span>O'qituvchi: <strong>{group.teacherName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FiClock className="text-green-500" />
                        <span>Vaqt: {group.startTime} - {group.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FiDollarSign className="text-yellow-500" />
                        <span>Narx: <strong>{formatCurrency(group.price)}</strong></span>
                    </div>
                    {group.daysOfWeek && group.daysOfWeek.length > 0 && (
                        <div className="flex items-center gap-2">
                            <FiCalendar className="text-purple-500" />
                            <span>Kunlar: {group.daysOfWeek.join(', ')}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                    <label className="text-sm text-gray-600">Davr:</label>
                    <select
                        value={selectedDate.month}
                        onChange={(e) => setSelectedDate({...selectedDate, month: Number(e.target.value)})}
                        className="bg-transparent font-medium outline-none cursor-pointer"
                    >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}-oy</option>
                        ))}
                    </select>
                    <select
                        value={selectedDate.year}
                        onChange={(e) => setSelectedDate({...selectedDate, year: Number(e.target.value)})}
                        className="bg-transparent font-medium outline-none cursor-pointer"
                    >
                         <option value={currentDate.getFullYear() - 1}>{currentDate.getFullYear() - 1}</option>
                         <option value={currentDate.getFullYear()}>{currentDate.getFullYear()}</option>
                         <option value={currentDate.getFullYear() + 1}>{currentDate.getFullYear() + 1}</option>
                    </select>
                 </div>
            </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiUsers className="text-blue-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Jami O'quvchilar</p>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiDollarSign className="text-green-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-1">To'plangan</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">{paidStudents} ta to'liq to'lagan</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiDollarSign className="text-red-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Kutilayotgan</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(remainingRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">{unpaidStudents} ta to'lamagan</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FiUsers className="text-yellow-600 text-2xl" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Qisman</p>
          <p className="text-3xl font-bold text-yellow-600">{partialStudents}</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Guruh o'quvchilari</h2>
            <div className="flex w-full md:w-auto gap-2">
                <button
                    onClick={handleOpenAttendanceModal}
                    className="flex-1 md:flex-none justify-center cursor-pointer flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <FiCheckCircle /> Davomat
                </button>
               <button
  onClick={() => setIsAddStudentModalOpen(true)}
  className="
    flex-1 md:flex-none
    cursor-pointer
    flex items-center justify-center gap-2
    bg-blue-600 text-white
    px-4 md:px-4 py-2
    rounded-lg
    hover:bg-blue-700
    transition-colors
  "
>
  <FiUserPlus className="w-7 h-7 md:w-5 md:h-5" />

  {/* Matn faqat md va undan katta ekranlarda chiqadi */}
  <span className="hidden md:inline">
    O'quvchi qo'shish
  </span>
</button>

            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">F.I.SH</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Telefon</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Ota-ona</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">To'langan</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Qarzdorlik</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Status</th>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right md:text-left">Amallar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {!studentPayments || studentPayments.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="px-4 md:px-6 py-4 text-center text-gray-500">Guruhda o'quvchilar yo'q</td>
                        </tr>
                    ) : (
                        studentPayments.map((student) => (
                            <tr key={student.studentId} className="hover:bg-gray-50">
                                <td className="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">
                                    <div className="flex flex-col gap-1">
                                        <Link to={`/students/${student.studentId}`} className="hover:text-blue-600 text-base md:text-sm">
                                            {student.studentName}
                                        </Link>
                                        {/* Attendance Status Badge */}
                                        {(() => {
                                            const status = existingAttendance?.find(a => a.studentId === student.studentId)?.status;
                                            if (status) {
                                                return (
                                                    <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        status === 'PRESENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {status === 'PRESENT' ? 'BOR' : 'YO\'Q'}
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                                    {student.phoneNumber || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                                    {student.parentPhoneNumber || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-green-600 hidden md:table-cell">
                                    {formatCurrency(student.totalPaidInMonth)}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-red-600 hidden md:table-cell">
                                    {formatCurrency(student.remainingAmount)}
                                </td>
                                <td className="px-6 py-4 text-sm hidden md:table-cell">
                                    {student.paymentStatus === 'PAID' && (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">To'liq</span>
                                    )}
                                    {student.paymentStatus === 'PARTIAL' && (
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Qisman</span>
                                    )}
                                    {student.paymentStatus === 'UNPAID' && (
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">To'lanmagan</span>
                                    )}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-sm">
                                    <div className="flex items-center justify-end md:justify-start gap-2">
                                        <button
                                            onClick={() => handleSendAbsentSms(student)}
                                            className="cursor-pointer text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg transition-colors"
                                            title="Darsga kelmadi SMS"
                                        >
                                            <FiMessageSquare size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenHistoryModal(student)}
                                            className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors hidden md:block"
                                            title="Davomat tarixi"
                                        >
                                            <FiCalendar />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveStudent(student.studentId)}
                                            className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors hidden md:block"
                                            title="Guruhdan o'chirish"
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

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Davomat qilish"
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                   <div className="flex justify-between items-center px-2 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg sticky top-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase">O'quvchi</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                   </div>
                   <div className="divide-y divide-gray-100">
                       {studentPayments.map(student => (
                           <div 
                                key={student.studentId} 
                                className="flex justify-between items-center px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                                onClick={() => {
                                    const currentStatus = attendanceList[student.studentId];
                                    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
                                    setAttendanceList(prev => ({ ...prev, [student.studentId]: newStatus }));
                                }}
                           >
                               <span className="text-base font-medium text-gray-900">{student.studentName}</span>
                               <label className="flex items-center gap-3 cursor-pointer pointer-events-none">
                                    <div className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${attendanceList[student.studentId] === 'PRESENT' ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${attendanceList[student.studentId] === 'PRESENT' ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </div>
                                    <span className={`text-sm font-bold w-8 ${attendanceList[student.studentId] === 'PRESENT' ? 'text-green-600' : 'text-red-600'}`}>
                                        {attendanceList[student.studentId] === 'PRESENT' ? 'BOR' : 'YO\'Q'}
                                    </span>
                               </label>
                           </div>
                       ))}
                   </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                Bekor qilish
                </button>
                <button
                onClick={handleAttendanceSubmit}
                disabled={attendanceMutation.isLoading}
                className="cursor-pointer px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                {attendanceMutation.isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div>
          </div>
      </Modal>

      {/* Student History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`${selectedStudentForHistory?.studentName || ''} - Davomat Tarixi`}
      >
          <div className="max-h-[60vh] overflow-y-auto">
              {studentHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Davomat ma'lumotlari topilmadi</p>
              ) : (
                  <div className="space-y-2">
                      {studentHistory.map(record => (
                          <div key={record.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                              <span className="text-gray-900 font-medium">{record.attendanceDate}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  record.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                  {record.status === 'PRESENT' ? 'BOR' : 'YO\'Q'}
                              </span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
          <div className="mt-4 flex justify-end">
              <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                  Yopish
              </button>
          </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => {
            setIsAddStudentModalOpen(false);
            setStudentSearchTerm('');
        }}
        title="O'quvchi qo'shish"
      >
          <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qidirish</label>
                  <div className="relative mb-3">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                          type="text"
                          placeholder="Ism yoki telefon orqali qidirish..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                      />
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">O'quvchini tanlang</label>
                  <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      size={5}
                  >
                      <option value="">Tanlang</option>
                      {allStudents
                        .filter(s => !studentPayments?.some(existing => existing.studentId === s.id))
                        .filter(s => 
                            s.firstName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                            s.lastName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                            s.phoneNumber?.includes(studentSearchTerm)
                        )
                        .map(student => (
                          <option key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} ({student.phoneNumber || 'Tel. yo\'q'})
                          </option>
                      ))}
                  </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                type="button"
                onClick={() => {
                    setIsAddStudentModalOpen(false);
                    setStudentSearchTerm('');
                }}
                className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                Bekor qilish
                </button>
                <button
                type="submit"
                disabled={addStudentMutation.isLoading}
                className="cursor-pointer px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                {addStudentMutation.isLoading ? 'Yuklanmoqda...' : 'Qo\'shish'}
                </button>
            </div>
          </form>
      </Modal>
    </div>
  );
};

export default GroupDetails;