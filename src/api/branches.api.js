import api from './axios';

export const branchesApi = {
  getAll: (params) => api.get('/branches', { params }),
  getById: (id) => api.get(`/branches/${id}`),
  create: (branchData) => api.post('/branches', branchData),
  update: (id, branchData) => api.put(`/branches/${id}`, branchData),
  delete: (id) => api.delete(`/branches/${id}`),
};

