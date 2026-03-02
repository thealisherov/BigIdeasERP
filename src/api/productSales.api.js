import api from './axios';
import { getUserBranchId } from './helpers';

export const productSalesApi = {
  getAll: (params = {}) => {
    const branchId = params.branchId || getUserBranchId();
    return api.get('/product-sales', { params: { ...params, branchId } });
  },
  getById: (id) => api.get(`/product-sales/${id}`),
  create: (saleData) => {
    const branchId = saleData.branchId || getUserBranchId();
    return api.post('/product-sales', { ...saleData, branchId });
  },
  update: (id, saleData) => {
    const branchId = saleData.branchId || getUserBranchId();
    return api.put(`/product-sales/${id}`, { ...saleData, branchId });
  },
  delete: (id) => api.delete(`/product-sales/${id}`),
  getByCategory: (category, params = {}) => {
    const branchId = params.branchId || getUserBranchId();
    return api.get('/product-sales/by-category', { params: { branchId, category, ...params } });
  },
  getByStudent: (studentId) => {
    return api.get(`/product-sales/by-student/${studentId}`);
  },
  getByDateRange: (startDate, endDate, params = {}) => {
    const branchId = params.branchId || getUserBranchId();
    return api.get('/product-sales/by-date-range', { params: { branchId, startDate, endDate, ...params } });
  },
  getSummary: (year, month, params = {}) => {
    const branchId = params.branchId || getUserBranchId();
    return api.get('/product-sales/summary', { params: { branchId, year, month, ...params } });
  },
  getCategorySummary: (params = {}) => {
    const branchId = params.branchId || getUserBranchId();
    return api.get('/product-sales/category-summary', { params: { branchId, ...params } });
  }
};
