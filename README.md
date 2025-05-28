# 🎓 AI-LMS (Learning Management System)

Supabase를 백엔드로 하는 React 기반 학습 관리 시스템입니다.

## 🚀 주요 특징

- **📚 강의 관리**: 강의 생성, 수정, 카테고리별 분류
- **👥 역할 기반 권한**: 관리자, 강사, 학생 역할 지원  
- **🔐 완전한 인증 시스템**: 회원가입, 로그인, 이메일 인증
- **💳 결제 시스템**: 나이스페이 연동 (구독, 강의 결제)
- **📊 실시간 대시보드**: 학습 진도, 통계, 분석
- **🌐 반응형 디자인**: 모든 디바이스에서 최적화
- **🔄 실시간 기능**: Supabase Realtime 연동

## 🛠️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Redux Toolkit** (상태 관리)
- **React Router** (라우팅)
- **Tailwind CSS** (스타일링)

### Backend
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row Level Security (RLS)** (데이터 보안)

### Payment
- **NicePay** (결제 게이트웨이)

### Email
- **EmailJS** (이메일 서비스)

## 📦 설치 및 실행

### 1. 프로젝트 클론 및 설정

```bash
# 프로젝트 폴더로 이동
cd "LMS (1)/src/frontend"

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 Supabase 정보 입력
```

### 2. Supabase 설정

#### 2.1 Supabase 프로젝트 생성
1. [Supabase Console](https://app.supabase.com) 접속
2. 새 프로젝트 생성
3. 프로젝트 URL과 anon key 복사

#### 2.2 데이터베이스 스키마 설정
```sql
-- Supabase SQL Editor에서 실행
-- 1. 스키마 생성
\i supabase-schema.sql

-- 2. RLS 비활성화 (공개 데이터용)
\i quick-fix.sql

-- 3. 민감한 데이터 보호
\i setup-rls-for-private-data.sql

-- 4. 테스트 데이터 삽입 (선택사항)
\i insert-test-data.sql
```

#### 2.3 환경 변수 설정
```env
# .env 파일
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_NICEPAY_CLIENT_ID=your_nicepay_client_id
REACT_APP_EMAILJS_SERVICE_ID=your_emailjs_service_id
```

### 3. 개발 서버 실행

```bash
npm start
```

앱이 http://localhost:3000에서 실행됩니다.

## 👤 사용자 역할

### 🔴 관리자 (Admin)
- 모든 강의 관리 (생성, 수정, 삭제)
- 사용자 관리
- 카테고리 관리
- 시스템 설정
- 분석 및 통계

### 🟡 강사 (Instructor)  
- 자신의 강의 생성 및 관리
- 강의 콘텐츠 업로드
- 학생 진도 확인
- 강의 통계 조회

### 🟢 학생 (Student)
- 강의 수강
- 진도 추적
- 결제 및 구독
- 프로필 관리

### 🔵 비회원 (Guest)
- 강의 목록 조회
- 강의 미리보기
- 회원가입

## 🎯 주요 기능

### 📚 강의 관리
- **강의 목록**: 카테고리별, 레벨별 필터링
- **강의 상세**: 강사 정보, 커리큘럼, 리뷰
- **강의 생성**: 관리자/강사용 강의 생성 도구
- **진도 관리**: 챕터별 학습 진도 추적

### 🔐 인증 시스템
- **회원가입**: 이메일 인증, 역할 선택
- **로그인**: JWT 토큰 기반 인증
- **비밀번호**: 강도 검사, 암호화
- **프로필**: 개인정보 관리

### 💳 결제 시스템
- **구독**: 월간/연간 구독 플랜
- **단건 결제**: 개별 강의 구매
- **결제 연동**: 나이스페이 API
- **결제 내역**: 결제 기록 관리

### 📊 대시보드
- **학습 통계**: 진도율, 학습 시간
- **강의 통계**: 수강생 수, 평점
- **수익 분석**: 매출, 구독 현황

## 📁 프로젝트 구조

```
LMS (1)/
├── src/frontend/                    # React 프론트엔드
│   ├── public/                      # 정적 파일
│   ├── src/
│   │   ├── api/                     # API 클라이언트
│   │   │   ├── apiClient.ts         # Supabase API 래퍼
│   │   │   └── supabaseClient.ts    # Supabase 클라이언트
│   │   ├── app/                     # Redux 스토어
│   │   │   └── store.ts
│   │   ├── components/              # 재사용 컴포넌트
│   │   │   ├── common/              # 공통 컴포넌트
│   │   │   ├── auth/                # 인증 컴포넌트
│   │   │   ├── courses/             # 강의 컴포넌트
│   │   │   └── debug/               # 디버그 도구
│   │   ├── features/                # 기능별 컴포넌트
│   │   │   ├── auth/                # 인증 페이지
│   │   │   ├── courses/             # 강의 페이지
│   │   │   ├── dashboard/           # 대시보드
│   │   │   ├── admin/               # 관리자 페이지
│   │   │   ├── instructor/          # 강사 페이지
│   │   │   ├── payment/             # 결제 페이지
│   │   │   └── subscription/        # 구독 페이지
│   │   ├── lib/                     # 라이브러리 설정
│   │   │   └── supabase.ts          # Supabase 설정
│   │   ├── services/                # 외부 서비스
│   │   │   └── paymentService.ts    # 결제 서비스
│   │   ├── utils/                   # 유틸리티
│   │   │   ├── emailService.ts      # 이메일 서비스
│   │   │   └── supabasePublic.ts    # 공개 데이터 조회
│   │   ├── types/                   # TypeScript 타입
│   │   ├── data/                    # 정적 데이터
│   │   └── routes.tsx               # 라우팅 설정
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── supabase-schema.sql              # 데이터베이스 스키마
├── quick-fix.sql                    # RLS 비활성화
├── setup-rls-for-private-data.sql   # RLS 설정
├── insert-test-data.sql             # 테스트 데이터
└── README.md
```

## 🔧 개발 도구

### 디버그 페이지
- `/debug/courses` - 강의 데이터 디버그
- `/debug/simple` - 간단한 연결 테스트

### 스크립트
```bash
npm start              # 개발 서버
npm run build          # 프로덕션 빌드
npm test               # 테스트 실행
npx tsc --noEmit       # 타입 체크
```

## 🗄️ 데이터베이스 구조

### 공개 테이블 (RLS 비활성화)
- `courses` - 강의 정보
- `categories` - 카테고리
- `user_profiles` - 사용자 프로필 (공개 정보)
- `modules` - 강의 모듈
- `chapters` - 강의 챕터

### 보안 테이블 (RLS 활성화)
- `enrollments` - 수강 등록
- `payments` - 결제 내역
- `subscriptions` - 구독 정보
- `user_progress` - 학습 진도

## 🚨 트러블슈팅

### 강의가 안 보이는 경우
1. **RLS 확인**: `quick-fix.sql` 실행
2. **데이터 확인**: Supabase에서 강의 데이터 존재 여부 확인
3. **디버그**: `/debug/simple` 페이지에서 연결 테스트

### 로그인이 안 되는 경우
1. **환경 변수**: Supabase URL/Key 확인
2. **이메일 인증**: 개발 모드에서 팝업으로 인증번호 확인
3. **브라우저 콘솔**: 오류 메시지 확인

### 결제가 안 되는 경우
1. **나이스페이 설정**: 클라이언트 ID 확인
2. **테스트 모드**: 개발 환경에서는 시뮬레이션 결제

## 🌐 배포

### Vercel 배포
```bash
npm run build
# build/ 폴더를 Vercel에 배포
```

### 환경 변수 설정 (배포시)
```env
REACT_APP_SUPABASE_URL=production_url
REACT_APP_SUPABASE_ANON_KEY=production_key
REACT_APP_NICEPAY_CLIENT_ID=production_client_id
REACT_APP_NICEPAY_MODE=production
```

## 📞 지원

### 개발 환경
- Node.js 18+
- npm 8+
- TypeScript 4.9+

### 브라우저 지원
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.

---

**🚀 즐거운 학습 되세요!**