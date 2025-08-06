import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

// 인증 관련
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import EnhancedRegister from './features/auth/EnhancedRegister';

// 대시보드
import Dashboard from './features/dashboard/Dashboard';

// 강의 관련
import CourseList from './features/courses/CourseList';
import CourseDetail from './features/courses/CourseDetail';
import CourseIntroduction from './features/courses/CourseIntroduction';
import CourseIntroductionPage from './features/courses/CourseIntroductionPage';
import CourseQnAList from './features/courses/CourseQnAList';
import CourseQnADetail from './features/courses/CourseQnADetail';
import CourseQnAWrite from './features/courses/CourseQnAWrite';
import CourseQnAEdit from './features/courses/CourseQnAEdit';

// 수료증 관련
import CertificateList from './features/certificates/CertificateList';
import CertificateDetail from './features/certificates/CertificateDetail';

// 커뮤니티 관련
import CommunityList from './features/community/CommunityList';
import CommunityWrite from './features/community/CommunityWrite';
import CommunityDetail from './features/community/CommunityDetail';

// 결제 관련
import PaymentPage from './features/payment/PaymentPage';
import PaymentSuccess from './features/payment/PaymentSuccess';

// 결제 관련
import PaymentComplete from './features/payment/PaymentComplete';
import PaymentCancel from './features/payment/PaymentCancel';

// 실제 컴포넌트
import Profile from './features/profile/Profile';
import AdminDashboard from './features/admin/AdminDashboard';
import InstructorDashboard from './features/instructor/InstructorDashboard';
import CourseCreator from './features/instructor/CourseCreator';
import ProtectedRoute from './components/common/ProtectedRoute';

// 지원 페이지
import Help from './features/support/Help';
import FAQ from './features/support/FAQ';
import Contact from './features/support/Contact';

// 정책 페이지
import Terms from './features/legal/Terms';
import Privacy from './features/legal/Privacy';

// 디버그 컴포넌트
import CourseDebug from './components/debug/CourseDebug';
import SimpleCoursesTest from './components/debug/SimpleCoursesTest';

const NotFound = () => <div>404 - Page Not Found</div>;

// 라우트 설정 함수
export const createRoutes = (isAuthenticated: boolean, userRole: string): RouteObject[] => {
  return [
    // 공개 라우트
    {
      path: '/login',
      element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />,
    },
    {
      path: '/register',
      element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <EnhancedRegister />,
    },
    {
      path: '/register-old',
      element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />,
    },

    // 보호된 라우트
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/courses',
      element: <CourseList />, // 비회원도 강의 목록 볼 수 있음
    },
    {
      path: '/community',
      element: <CommunityList />, // 비회원도 커뮤니티 목록 볼 수 있음
    },
    {
      path: '/community/write',
      element: (
        <ProtectedRoute>
          <CommunityWrite />
        </ProtectedRoute>
      ),
    },
    {
      path: '/community/write/:postId',
      element: (
        <ProtectedRoute>
          <CommunityWrite />
        </ProtectedRoute>
      ),
    },
    {
      path: '/community/:postId',
      element: <CommunityDetail />, // 비회원도 게시글 볼 수 있음
    },
    {
      path: '/courses/:courseId',
      element: <CourseIntroductionPage />, // 강의 소개 페이지 (비회원도 접근 가능)
    },
    {
      path: '/courses/:courseId/learn',
      element: (
        <ProtectedRoute>
          <CourseDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/courses/:courseId/qna',
      element: (
        <ProtectedRoute>
          <CourseQnAList />
        </ProtectedRoute>
      ),
    },
    {
      path: '/courses/:courseId/qna/write',
      element: (
        <ProtectedRoute>
          <CourseQnAWrite />
        </ProtectedRoute>
      ),
    },
    {
      path: '/courses/:courseId/qna/:qnaId',
      element: (
        <ProtectedRoute>
          <CourseQnADetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/courses/:courseId/qna/:qnaId/edit',
      element: (
        <ProtectedRoute>
          <CourseQnAEdit />
        </ProtectedRoute>
      ),
    },
    {
      path: '/certificates',
      element: (
        <ProtectedRoute>
          <CertificateList />
        </ProtectedRoute>
      ),
    },
    {
      path: '/certificates/:certificateNumber',
      element: <CertificateDetail />, // 공개 접근 가능 (검증용)
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      ),
    },
    {
      path: '/payment/:courseId',
      element: (
        <ProtectedRoute>
          <PaymentPage />
        </ProtectedRoute>
      ),
    },
    {
      path: '/payment/success',
      element: (
        <ProtectedRoute>
          <PaymentSuccess />
        </ProtectedRoute>
      ),
    },
    {
      path: '/payment/complete',
      element: (
        <ProtectedRoute>
          <PaymentComplete />
        </ProtectedRoute>
      ),
    },
    {
      path: '/payment/cancel',
      element: (
        <ProtectedRoute>
          <PaymentCancel />
        </ProtectedRoute>
      ),
    },

    // 강사 전용 라우트
    {
      path: '/my-courses',
      element: (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <InstructorDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/instructor/courses/create',
      element: (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <CourseCreator />
        </ProtectedRoute>
      ),
    },
    {
      path: '/instructor/courses/:courseId/edit',
      element: (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <CourseCreator />
        </ProtectedRoute>
      ),
    },

    // 관리자 전용 라우트
    {
      path: '/admin',
      element: (
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      ),
    },

    // 지원 페이지 (공개)
    {
      path: '/help',
      element: <Help />,
    },
    {
      path: '/faq',
      element: <FAQ />,
    },
    {
      path: '/contact',
      element: <Contact />,
    },

    // 정책 페이지 (공개)
    {
      path: '/terms',
      element: <Terms />,
    },
    {
      path: '/privacy',
      element: <Privacy />,
    },

    // 디버그 라우트 (개발용)
    {
      path: '/debug/courses',
      element: (
        <ProtectedRoute>
          <CourseDebug />
        </ProtectedRoute>
      ),
    },
    {
      path: '/debug/simple',
      element: <SimpleCoursesTest />, // 비회원도 접근 가능한 간단 테스트
    },

    // 리디렉션
    {
      path: '/',
      element: <Navigate to={isAuthenticated ? (userRole === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />,
    },

    // 찾을 수 없는 페이지
    {
      path: '*',
      element: <NotFound />,
    },
  ];
};

export default createRoutes;