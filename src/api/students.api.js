// import api from './axios';

// export const studentsApi = {
//   getAll: (params) => api.get('/students', { params }),
//   getById: (id) => api.get(`/students/${id}`),
//   create: (studentData) => api.post('/students', studentData),
//   update: (id, studentData) => api.put(`/students/${id}`, studentData),
//   delete: (id) => api.delete(`/students/${id}`),
//   getPaymentHistory: (id) => api.get(`/students/${id}/payment-history`),
//   getGroups: (id) => api.get(`/students/${id}/groups`),
//   getUnpaid: (params) => api.get('/students/unpaid', { params }),
//   getStatistics: (params) => api.get('/students/statistics', { params }),
//   search: (params) => api.get('/students/search', { params }),
//   getRecent: (params) => api.get('/students/recent', { params }),
//   getByPaymentStatus: (params) => api.get('/students/by-payment-status', { params }),
//   getByGroup: (groupId, params) => api.get(`/students/by-group`, { params: { groupId, ...params } }),
// };

// src/api/students.api.js
import api from './axios';
import { getUserBranchId } from './helpers';

export const studentsApi = {
  getAll: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/students', { params: { branchId, ...params } });
  },
  
  getById: (id, params = {}) => {
    return api.get(`/students/${id}`, { params });
  },
  
  create: (studentData) => {
    const branchId = getUserBranchId();
    return api.post('/students', { ...studentData, branchId });
  },
  
  update: (id, studentData) => {
    const branchId = getUserBranchId();
    return api.put(`/students/${id}`, { ...studentData, branchId });
  },
  
  delete: (id) => api.delete(`/students/${id}`),
  
  getPaymentHistory: (id) => api.get(`/students/${id}/payment-history`),
  
  getGroups: (id) => api.get(`/students/${id}/groups`),
  
  getUnpaid: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/students/unpaid', { params: { branchId, ...params } });
  },
  
  getStatistics: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/students/statistics', { params: { branchId, ...params } });
  },
  
  search: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/students/search', { params: { branchId, ...params } });
  },
  
  getRecent: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/students/recent', { params: { branchId, ...params } });
  },
  
  getByPaymentStatus: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/students/by-payment-status', { params: { branchId, ...params } });
  },
  
  getByGroup: (groupId, params = {}) => {
    return api.get(`/students/by-group`, { params: { groupId, ...params } });
  },
};