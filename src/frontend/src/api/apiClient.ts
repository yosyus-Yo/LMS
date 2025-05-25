import axios from 'axios';

// Backend URL (설정이 다른 환경에 따라 다름)
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.ai-lms.example.com' // 프로덕션 URL (실제 배포시 변경 필요)
  : 'http://localhost:8000';         // 개발 환경 URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests if available
apiClient.interceptors.request.use(
  (config) => {
    // 개발 모드 로그
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, 
        config.url?.includes('login') ? '로그인 요청 데이터: ' + JSON.stringify(config.data) : '');
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle common error scenarios
apiClient.interceptors.response.use(
  (response) => {
    // 개발 모드 로그
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  (error) => {
    // 개발 모드에서는 모든 네트워크 오류를 로그
    if (process.env.NODE_ENV === 'development') {
      if (error.response) {
        // 서버에서 응답이 왔지만 오류 상태 코드
        console.log('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config.url,
          method: error.config.method
        });
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못함 (네트워크 오류 등)
        console.log('API Network Error:', {
          url: error.config.url, 
          method: error.config.method
        });
      } else {
        // 요청 설정 중 오류 발생
        console.log('API Config Error:', error.message);
      }
    }
    
    // 401 Unauthorized 처리
    if (error.response && error.response.status === 401) {
      // 토큰이 만료되었거나 유효하지 않음
      if (error.config.url !== '/api/auth/login/') {
        // 로그인 엔드포인트가 아닌 경우에만 로그아웃 처리
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;