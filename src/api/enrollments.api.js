import api from './axios';

export const enrollmentsApi = {
  create: (data) => api.post('/enrollments', data),

  update: (id, data) => api.put(`/enrollments/${id}`, data),

  delete: (id) => api.delete(`/enrollments/${id}`),

  getAll: (params = {}) => api.get('/enrollments', { params }),

  getByStudent: (studentId) => api.get('/enrollments', { params: { studentId } }),

  getByGroup: (groupId) => api.get('/enrollments', { params: { groupId } }),

  getByStudentAndGroup: (studentId, groupId) =>
    api.get('/enrollments', { params: { studentId, groupId } }),
};
