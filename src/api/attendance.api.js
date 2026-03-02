import api from './axios';
import { getUserBranchId } from './helpers';

export const attendanceApi = {
  // Bulk davomat (barcha o'quvchilar uchun bir vaqtda)
  markBulk: (data) => {
    const branchId = getUserBranchId();
    return api.post('/attendance/bulk', { ...data, branchId });
  },

  // Bitta o'quvchi uchun davomat
  markAttendance: (data) => {
    const branchId = getUserBranchId();
    return api.post('/attendance', { ...data, branchId });
  },

  // Guruh uchun ma'lum sanada davomatni olish
  getByGroupAndDate: (groupId, date) => {
    // date formatda: "YYYY-MM-DD" (LocalDate format)
    return api.get(`/attendance/group/${groupId}/date/${date}`);
  },

  // O'quvchining ma'lum oy uchun davomat tarixi
  getStudentAttendanceByMonth: (studentId, groupId, year, month) => {
    return api.get(`/attendance/student/${studentId}/group/${groupId}/month`, {
      params: { year, month }
    });
  },

  // Guruhning ma'lum oy uchun davomat xulosasi
  getGroupSummary: (groupId, year, month) => {
    return api.get(`/attendance/group/${groupId}/summary`, {
      params: { year, month }
    });
  },

  // Davomatni o'chirish
  delete: (id) => {
    return api.delete(`/attendance/${id}`);
  }
};