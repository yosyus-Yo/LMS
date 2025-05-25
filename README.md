# AI-LMS: 인공지능 기반 학습관리시스템

AI-LMS는 AI를 활용하여 개인화된 학습 경험을 제공하는 클라우드 기반 학습관리시스템(LMS)의 MVP입니다. 이 시스템은 CAIS(Claude Code 자동 구현 시스템)를 활용하여 설계 문서를 기반으로 구현되었습니다.

## 프로젝트 개요

AI-LMS는 다음과 같은 핵심 기능을 제공합니다:

- **사용자 관리**: 학생, 강사, 관리자 역할별 인증 및 권한 관리
- **강의 관리**: 강의 콘텐츠 생성, 구조화 및 관리
- **학습 경험**: 진도 추적, 평가, 개인화된 학습 경로 제공
- **AI 챗봇 튜터**: 24시간 학습 지원 및 질문 응대
- **데이터 분석**: 학습 데이터 시각화 및 인사이트 제공

## 기술 스택

### 프론트엔드
- React 18.x
- Redux Toolkit
- TailwindCSS
- Chart.js

### 백엔드
- Django 5.x
- Django REST Framework
- PostgreSQL
- Redis (캐싱)
- JWT 인증

### 인프라
- AWS (EC2, S3, RDS)
- Docker
- Nginx

## 시작하기

### 전제 조건
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+
- Redis

### 설치 및 실행

#### 백엔드 설정

1. 백엔드 디렉토리로 이동
   ```bash
   cd src/backend
   ```

2. 가상환경 생성 및 활성화
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. 의존성 설치
   ```bash
   pip install -r requirements.txt
   ```

4. 환경 변수 설정
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 필요한 값들 설정
   ```

5. 데이터베이스 마이그레이션
   ```bash
   python manage.py migrate
   ```

6. 개발 서버 실행
   ```bash
   python manage.py runserver
   ```

#### 프론트엔드 설정

1. 프론트엔드 디렉토리로 이동
   ```bash
   cd src/frontend
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 개발 서버 실행
   ```bash
   npm start
   ```

## 프로젝트 구조

```
/src
  /backend
    /apps
      /users      # 사용자 관리 앱
      /courses    # 강의 관리 앱
      /analytics  # 데이터 분석 앱
    /config       # 프로젝트 설정
  /frontend
    /public
    /src
      /api        # API 클라이언트
      /components # 재사용 가능한 컴포넌트
      /features   # 기능별 모듈
      /utils      # 유틸리티 함수
```

## API 참조

API 문서는 다음 URL에서 확인할 수 있습니다:

- 개발 환경: http://localhost:8000/api/docs/

주요 API 엔드포인트:

- `/api/auth/*`: 인증 관련 엔드포인트
- `/api/users/*`: 사용자 관리 엔드포인트
- `/api/courses/*`: 강의 관리 엔드포인트
- `/api/analytics/*`: 데이터 분석 엔드포인트

## 기여

프로젝트에 기여하기 위한 가이드라인:

1. 레포지토리 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 라이센스

이 프로젝트는 MIT 라이센스로 배포됩니다.

## 문의

이 프로젝트에 대한 질문이나 피드백이 있으시면 이슈를 생성해주세요.