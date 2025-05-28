import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { jwtDecode } from 'jwt-decode';

// 타입 정의
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
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
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor' | 'admin';
  phone_number?: string;
  address?: string;
  organization?: string;
  job_title?: string;
  bio?: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

// localStorage에서 사용자 정보 복원
const getInitialAuthState = (): AuthState => {
  try {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (token && userString) {
      const user = JSON.parse(userString);
      return {
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    }
  } catch (error) {
    console.error('로컬 저장소에서 인증 정보 복원 실패:', error);
    // 오류 시 localStorage 정리
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  return {
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

// 초기 상태
const initialState: AuthState = getInitialAuthState();

// 로그인 비동기 액션 (Supabase 통합)
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.auth.login(credentials.email, credentials.password);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// 회원가입 비동기 액션
export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      if (credentials.password !== credentials.password_confirm) {
        return rejectWithValue('Passwords do not match');
      }
      
      const response = await apiClient.auth.register(
        credentials.email,
        credentials.password,
        credentials.first_name,
        credentials.last_name,
        credentials.role,
        {
          phone_number: credentials.phone_number,
          address: credentials.address,
          organization: credentials.organization,
          job_title: credentials.job_title,
          bio: credentials.bio,
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

// 사용자 정보 가져오기 액션
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.auth.getCurrentUser();
      
      if (!response.data) {
        return rejectWithValue('No user found');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      return rejectWithValue(error.message || 'Failed to fetch user profile');
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
      localStorage.removeItem('user');
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
        state.token = action.payload.token;
        state.user = action.payload.user;
        
        // localStorage에 저장
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
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
        // 인증 오류시 로그아웃 처리
        const errorMessage = action.payload as string;
        if (errorMessage?.includes('not authenticated') || errorMessage?.includes('No user found')) {
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