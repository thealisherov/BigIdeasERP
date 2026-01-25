// import api from './axios';
// import axios from 'axios';
// import { API_ENDPOINTS } from '../utils/constants';

// export const authApi = {
//   login: (credentials) => {
//     // 401 xatolikda global interceptor sahifani yangilamasligi uchun alohida so'rov
//     const baseURL = api.defaults.baseURL || 'https://bigideaslc-production.up.railway.app/api';
//     return axios.post(`${baseURL}${API_ENDPOINTS.AUTH.LOGIN}`, credentials);
//   },
//   logout: (userId) => api.post(`${API_ENDPOINTS.AUTH.LOGOUT}?userId=${userId}`),
//   refreshToken: (refreshToken) => api.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }),
// };

import api from './axios';
import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

export const authApi = {
  login: async (credentials) => {
    console.log('🌐 authApi.login called with:', credentials);
    
    // 401 xatolikda global interceptor sahifani yangilamasligi uchun alohida so'rov
    const baseURL = api.defaults.baseURL || 'https://bigideaslc-production.up.railway.app/api';
    const url = `${baseURL}${API_ENDPOINTS.AUTH.LOGIN}`;
    
    console.log('📡 Sending POST request to:', url);
    
    try {
      const response = await axios.post(url, credentials);
      console.log('✅ Login response status:', response.status);
      console.log('📦 Login response data:', response.data);
      
      // Response strukturasini tekshirish
      if (response.data) {
        console.log('🔍 Response structure check:');
        console.log('  - data.token:', response.data.token ? 'EXISTS' : 'MISSING');
        console.log('  - data.accessToken:', response.data.accessToken ? 'EXISTS' : 'MISSING');
        console.log('  - data.data:', response.data.data ? 'EXISTS' : 'MISSING');
        
        if (response.data.data) {
          console.log('  - data.data.token:', response.data.data.token ? 'EXISTS' : 'MISSING');
          console.log('  - data.data.accessToken:', response.data.data.accessToken ? 'EXISTS' : 'MISSING');
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login request failed:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  logout: (userId) => {
    console.log('🚪 authApi.logout called for userId:', userId);
    return api.post(`${API_ENDPOINTS.AUTH.LOGOUT}?userId=${userId}`);
  },
  
  refreshToken: (refreshToken) => {
    console.log('🔄 authApi.refreshToken called');
    return api.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  },
};