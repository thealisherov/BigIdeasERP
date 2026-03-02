import api from './axios';
import { getUserBranchId } from './helpers';

export const teachersApi = {
  getAll: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/teachers', { params: { branchId, ...params } });
  },
  getById: (id) => api.get(`/teachers/${id}`),
  create: (teacherData) => {
    const branchId = getUserBranchId();
    return api.post('/teachers', { ...teacherData, branchId });
  },
  update: (id, teacherData) => {
    const branchId = getUserBranchId();
    return api.put(`/teachers/${id}`, { ...teacherData, branchId });
  },
  delete: (id) => api.delete(`/teachers/${id}`),
  search: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/teachers/search', { params: { branchId, ...params } });
  },
  getBySalaryType: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/teachers/by-salary-type', { params: { branchId, ...params } });
  },
};