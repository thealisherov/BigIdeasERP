import api from './axios';
import { getUserBranchId } from './helpers';

export const groupsApi = {
  getAll: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/groups', { params: { branchId, ...params } });
  },
  getById: (id, year, month) => {
    // Agar year va month berilgan bo'lsa, params sifatida yuborish
    if (year && month) {
      return api.get(`/groups/${id}`, { params: { year, month } });
    }
    return api.get(`/groups/${id}`);
  },
  create: (groupData) => {
    const branchId = getUserBranchId();
    return api.post('/groups', { ...groupData, branchId });
  },
  update: (id, groupData) => {
    const branchId = getUserBranchId();
    return api.put(`/groups/${id}`, { ...groupData, branchId });
  },
  delete: (id) => api.delete(`/groups/${id}`),
  addStudent: (groupId, studentId) => api.post(`/groups/${groupId}/students/${studentId}`),
  removeStudent: (groupId, studentId) => api.delete(`/groups/${groupId}/students/${studentId}`),
  getUnpaidStudents: (id, params = {}) => api.get(`/groups/${id}/unpaid-students`, { params }),
  search: (params = {}) => {
    const branchId = getUserBranchId();
    return api.get('/groups/search', { params: { branchId, ...params } });
  },
  getByTeacher: (teacherId, params = {}) => {
    return api.get('/groups/by-teacher', { params: { teacherId, ...params } });
  },
};