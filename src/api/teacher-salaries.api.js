import api from './axios';
import { getUserBranchId } from './helpers';

export const teacherSalariesApi = {
  createPayment: (paymentData) => {
    const branchId = getUserBranchId();
    return api.post('/teacher-salaries/payments', { ...paymentData, branchId });
  },
  deletePayment: (paymentId) => api.delete(`/teacher-salaries/payments/${paymentId}`),
  getRemainingByTeacher: (teacherId, params = {}) => {
    return api.get(`/teacher-salaries/remaining/teacher/${teacherId}`, { params });
  },
  getPaymentsByTeacher: (teacherId, params = {}) => {
    return api.get(`/teacher-salaries/payments/teacher/${teacherId}`, { params });
  },
  getPaymentsByTeacherAndMonth: (teacherId, params = {}) => {
    return api.get(`/teacher-salaries/payments/teacher/${teacherId}/month`, { params });
  },
  getPaymentsByBranch: (branchId, params = {}) => {
    return api.get(`/teacher-salaries/payments/branch/${branchId}`, { params });
  },
  getHistoryByTeacher: (teacherId, params = {}) => {
    return api.get(`/teacher-salaries/history/teacher/${teacherId}`, { params });
  },
  calculateByTeacher: (teacherId, params = {}) => {
    return api.get(`/teacher-salaries/calculate/teacher/${teacherId}`, { params });
  },
  calculateByBranch: (branchId, params = {}) => {
    return api.get(`/teacher-salaries/calculate/branch/${branchId}`, { params });
  },
};
