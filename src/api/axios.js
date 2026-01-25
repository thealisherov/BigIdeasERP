import axios from 'axios';

const api = axios.create({
  baseURL: "https://bigideaslc-production.up.railway.app/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
      // Debugging uchun
      if (import.meta.env.DEV) {
        console.log('Request with token:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.error(`[API Error] ${status} - ${url}`, error.response?.data);
    
    // Faqat 401'da logout qil (token muddati o'tgan)
    if (status === 401) {
      console.warn('401 Unauthorized - Tokenning muddati o\'tgan');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    // 403'da ham logout qil lekin boshqacha xabar ayt
    else if (status === 403) {
      console.error('403 Forbidden - Ruxsat yo\'q');
    }
    
    return Promise.reject(error);
  }
);

export default api;