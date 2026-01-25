import api from './axios';
import { getUserBranchId } from './helpers';

export const paymentsApi = {
  getAll: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/payments', { params: { branchId, ...params } });
  },
  getById: (id) => api.get(`/payments/${id}`),
  create: (paymentData) => {
    const branchId = getUserBranchId();
    return api.post('/payments', { ...paymentData, branchId });
  },
  update: (id, paymentData) => {
    return api.put(`/payments/${id}`, paymentData);
  },
  delete: (id) => api.delete(`/payments/${id}`),
  getUnpaid: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/payments/unpaid', { params: { branchId, ...params } });
  },
  getByStudent: (studentId, params = {}) => {
    return api.get(`/payments/student/${studentId}`, { params });
  },
  search: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/payments/search', { params: { branchId, ...params } });
  },
  getRecent: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/payments/recent', { params: { branchId, ...params } });
  },
  getByMonth: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/payments/by-month', { params: { branchId, ...params } });
  },
  getByDateRange: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/payments/by-date-range', { params: { branchId, ...params } });
  },
};
