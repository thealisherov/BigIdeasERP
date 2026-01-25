import { useReducer, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authReducer } from './AuthReducer';
import { authApi } from '../api/auth.api';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  initialized: false,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (token && userStr && token !== 'undefined' && token !== 'null') {
        // Vaqtni tekshirish
        if (loginTimestamp) {
          const now = Date.now();
          if (now - parseInt(loginTimestamp) > twentyFourHours) {
            console.log('⚠️ Session expired automatically after 24 hours');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('loginTimestamp');
            dispatch({
              type: 'INIT_COMPLETE',
              payload: null,
            });
            return;
          }
        }

        try {
          const user = JSON.parse(userStr);
          dispatch({
            type: 'INIT_COMPLETE',
            payload: { user, token },
          });
        } catch (error) {
          console.error('❌ Error parsing user from localStorage:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('loginTimestamp');
          dispatch({
            type: 'INIT_COMPLETE',
            payload: null,
          });
        }
      } else {
        console.log('⚠️ No valid token/user found in localStorage');
        dispatch({
          type: 'INIT_COMPLETE',
          payload: null,
        });
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (credentials) => {
    console.log('🔐 Login attempt with:', credentials);
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authApi.login(credentials);
      console.log('📡 Login response received:', response);
      
      const data = response.data;
      console.log('📦 Response data:', data);
      
      // Token ni topish
      let token = null;
      let userData = null;
      
      // Backend turli formatda javob berishi mumkin
      if (data.token) {
        token = data.token;
        userData = data;
      } else if (data.accessToken) {
        token = data.accessToken;
        userData = data;
      } else if (data.data && data.data.token) {
        token = data.data.token;
        userData = data.data;
      } else if (data.data && data.data.accessToken) {
        token = data.data.accessToken;
        userData = data.data;
      }
      
      console.log('🔑 Extracted token:', token ? token.substring(0, 30) + '...' : 'NOT FOUND');
      console.log('👤 Extracted userData:', userData);

      if (!token) {
        console.error('❌ Token not found in response!', data);
        const errorMessage = 'Serverdan token kelmadi. Login javobini tekshiring.';
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      // User obyektini yaratish
      const user = {
        id: userData.userId || userData.id,
        username: userData.username,
        role: userData.role,
        branchId: userData.branchId || null,
        branchName: userData.branchName || null,
      };

      console.log('👤 User object to save:', user);
      console.log('🔑 Token to save:', token);
      
      // localStorage'ga saqlash
      try {
        localStorage.setItem('token', token);
        console.log('✅ Token saved to localStorage');
        
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User saved to localStorage');

        if (userData.refreshToken) {
          localStorage.setItem('refreshToken', userData.refreshToken);
          console.log('✅ RefreshToken saved to localStorage');
        }

        localStorage.setItem('loginTimestamp', Date.now().toString());
        
        // Tekshirish
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        console.log('🔍 Verification - Token saved:', savedToken === token);
        console.log('🔍 Verification - User saved:', savedUser === JSON.stringify(user));
        
        if (savedToken !== token || savedUser !== JSON.stringify(user)) {
          throw new Error('localStorage save verification failed');
        }
        
      } catch (storageError) {
        console.error('❌ localStorage error:', storageError);
        const errorMessage = 'Ma\'lumotlarni saqlashda xatolik. Browser sozlamalarini tekshiring.';
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      console.log('✅ Dispatching LOGIN_SUCCESS');
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });
      
      console.log('✅ Login successful!');
      return { success: true };
      
    } catch (error) {
      let errorMessage = 'Login xatosi';
      
      console.error('❌ Login error:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Serverga ulanib bo\'lmadi. Backend ishlaydimi?';
      } else if (error.response?.status === 401) {
        errorMessage = 'Username yoki parol noto\'g\'ri';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Noto\'g\'ri ma\'lumotlar';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Final error message:', errorMessage);
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    console.log('🚪 Logout started');
    try {
      if (state.user && state.user.id) {
        await authApi.logout(state.user.id);
        console.log('✅ Logout API call successful');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      console.log('🧹 Clearing localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('loginTimestamp');
      
      dispatch({ type: 'LOGOUT' });
      console.log('✅ Logout complete');
    }
  };

  // Har 1 daqiqada sessiya vaqtini tekshirish
  useEffect(() => {
    const interval = setInterval(() => {
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      if (state.token && loginTimestamp) {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (now - parseInt(loginTimestamp) > twentyFourHours) {
          console.log('⏰ Auto logout: 24h limit reached');
          logout();
        }
      }
    }, 60000); // 1 daqiqa

    return () => clearInterval(interval);
  }, [state.token, logout]);

  const value = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
