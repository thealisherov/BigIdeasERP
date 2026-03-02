import api from './axios';
import { getUserBranchId } from './helpers';

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getByBranch: (branchId) => api.get(`/users/branch/${branchId}`),
  // Helper for admin to get users of their own branch
  getMyBranchUsers: () => {
    const branchId = getUserBranchId();
    return api.get(`/users/branch/${branchId}`);
  }
};