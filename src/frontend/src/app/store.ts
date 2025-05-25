import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Redux 슬라이스 (추후 개별 파일로 분리)
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // 향후 추가될 reducer들:
    // courses: coursesReducer,
    // user: userReducer,
    // learning: learningReducer,
    // admin: adminReducer,
    // chatbot: chatbotReducer,
  },
  // 미들웨어 설정 (필요시)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 직렬화 불가능한 값 무시 설정 (필요시)
        ignoredActions: [],
        ignoredActionPaths: [],
        ignoredPaths: [],
      },
    }),
});

// 타입스크립트를 위한 타입 정의
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 훅 정의 - 컴포넌트에서 사용하기 위함
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;