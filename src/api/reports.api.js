import api from './axios';
import { getUserBranchId } from './helpers';

const getBranchId = (params) => {
  if (params && params.branchId) {
    return params.branchId;
  }
  return getUserBranchId();
};

export const reportsApi = {
  getPaymentsByRange: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/payments/range', { params: { ...params, branchId } });
  },
  getPaymentsMonthly: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/payments/monthly', { params: { ...params, branchId } });
  },
  getPaymentsDaily: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/payments/daily', { params: { ...params, branchId } });
  },
  getFinancialSummary: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/financial/summary', { params: { ...params, branchId } });
  },
  getFinancialSummaryRange: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/financial/summary-range', { params: { ...params, branchId } });
  },
  getExpensesByRange: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/expenses/range', { params: { ...params, branchId } });
  },
  getExpensesMonthly: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/expenses/monthly', { params: { ...params, branchId } });
  },
  getExpensesDaily: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/expenses/daily', { params: { ...params, branchId } });
  },
  getExpensesAllTime: (params = {}) => {
    const branchId = getBranchId(params);
    return api.get('/reports/expenses/all-time', { params: { ...params, branchId } });
  },
};
