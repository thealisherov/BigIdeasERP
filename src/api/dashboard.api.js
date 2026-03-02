import api from './axios';
import { getUserBranchId } from './helpers';

export const dashboardApi = {
  getStats: () => {
    // branchId ni helper orqali olish
    const branchId = getUserBranchId();
    
    // Agar branchId mavjud bo'lsa, parametr sifatida yuborish
    const params = branchId ? { branchId } : {};
    
    return api.get('/dashboard/stats', { params });
  },
};