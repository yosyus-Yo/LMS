import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { jwtDecode } from 'jwt-decode';

// 타입 정의
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// 초기 상태
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: localStorage.getItem('token') ? true : false,
  isLoading: false,
  error: null,
};

// 로그인 비동기 액션
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // 백엔드 API 엔드포인트로 요청
      const response = await apiClient.post<LoginResponse>(
        '/api/auth/login/',
        credentials
      );
      
      // 로컬 스토리지에 토큰 저장
      localStorage.setItem('token', response.data.access);
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response) {
        // 서버 응답 오류 처리
        return rejectWithValue(error.response.data?.detail || error.response.data?.message || 'Login failed');
      }
      return rejectWithValue('Network error occurred. Please check your connection and try again.');
    }
  }
);

// 회원가입 비동기 액션
export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      // 실제 백엔드 API 요청
      const response = await apiClient.post<User>(
        '/api/auth/register/',
        credentials
      );
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response) {
        const errorMessage = 
          error.response.data?.detail || 
          error.response.data?.message || 
          (typeof error.response.data === 'string' ? error.response.data : 'Registration failed');
        return rejectWithValue(errorMessage);
      }
      
      return rejectWithValue('Network error occurred. Please check your connection and try again.');
    }
  }
);

// 사용자 정보 가져오기 액션
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      
      if (!auth.token) {
        return rejectWithValue('No authentication token');
      }
      
      // 실제 백엔드 API 요청
      const response = await apiClient.get<User>('/api/auth/profile/');
      // 토큰은 apiClient의 인터셉터에서 자동으로 추가됨
      
      return response.data;
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      
      if (error.response) {
        const errorMessage = 
          error.response.data?.detail || 
          error.response.data?.message || 
          'Failed to fetch user profile';
        return rejectWithValue(errorMessage);
      }
      return rejectWithValue('Network error occurred. Please check your connection and try again.');
    }
  }
);

// Auth 슬라이스
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 로그인 액션 처리
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // 회원가입 액션 처리
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // 사용자 정보 가져오기 액션 처리
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // 토큰이 만료된 경우 로그아웃 처리
        if (action.payload === 'Token is invalid or expired') {
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;