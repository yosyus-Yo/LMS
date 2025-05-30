# 🔄 AI 기반 LMS 플랫폼 MVP 프롬프트 체인 설계도 v1.0
> 효율적이고 개인화된 학습 경험을 제공하는 AI 통합 학습관리시스템 구현을 위한 설계도

---
description: "AI 기반 LMS 플랫폼의 아키텍처 설계도"
globs: ["*.md", "*.mdc"]
alwaysApply: true
priority: 2
requires: ["prd.md"]
---

작성일: 2025-05-15 | 최종 수정: 2025-05-18
작성자: AI 아키텍트 | 검토자: LMS 솔루션 전문가

## 목표 및 사용자 정의

### 핵심 목표
기관과 기업이 효과적으로 학습 콘텐츠를 관리하고, AI 기반 개인화 학습 경험을 제공하며, 데이터 기반 학습 성과 관리가 가능한 확장성 있는 LMS 플랫폼 MVP 구축

### 대상 사용자
- **관리자**: 시스템 설정, 사용자 관리, 통계 분석을 담당하는 교육 관리자
- **강사**: 강의 콘텐츠 제작, 학습자 평가, 질문 응대를 수행하는 교육 전문가
- **수강생**: 다양한 기기에서 학습 콘텐츠에 접근하고 평가받는 학습자

### 결과물 형태
Django/React 기반 웹 애플리케이션으로, 모바일 접근성을 갖추고 AWS 클라우드 환경에 배포 가능한 MVP 수준의 LMS 플랫폼

### 성공 지표
- **기술적 완성도**: 9개 핵심 기능 모두 정상 작동 및 통합
- **성능 지표**: 페이지 로딩 2초 이내, 동시 사용자 100명 이상 지원
- **사용자 경험**: 초기 사용자 만족도 80% 이상 달성

## 체인 유형 및 구조

### 체인 유형
선형 체인을 기본으로 하되, 사용자 역할(관리자/강사/수강생)에 따른 분기 체인과 독립적 기능(AI 챗봇, 수료증 발급)을 위한 병렬 체인을 혼합 사용

### 체인 구조 다이어그램
```
시스템 초기화/설정 → 사용자 관리 → 강의 관리 → 수강 관리 → 학습 경험
                                               ↓
                  관리자 대시보드 ← 통합 도구(AI 챗봇, 커뮤니케이션, 수료증)
```

### 데이터 흐름 방식
- 각 단계는 이전 단계의 출력을 입력으로 받아 처리
- 사용자 역할에 따라 접근 가능한 기능 분기
- API 엔드포인트와 JWT 토큰을 통한 모듈 간 통신
- 외부 서비스(AWS S3, OpenAI API 등)와의 통합 지점 명시

## 단계별 프롬프트 정의

### 단계 1: 시스템 초기화 및 기본 설정

#### 목적 및 연결점
- 목적: LMS 플랫폼의 기반 구조와 기술 스택 초기화
- 연결점: 이후 모든 단계의 기반이 되는 시스템 아키텍처 제공

#### 입력 사양
- 데이터 형식: 텍스트 기반 요구사항 문서
- 필수 요소:
  - 핵심 기능 목록(9개 기능)
  - 기술 스택 요구사항(Django/React, PostgreSQL, AWS S3 등)
  - 비기능적 요구사항(보안, 확장성, 성능 등)
- 선택 요소:
  - UI/UX 디자인 가이드라인
  - 확장성 고려사항

#### 프롬프트 구조
- 맥락 설정: LMS 플랫폼 MVP 개발을 위한 초기 시스템 아키텍처 설계
- 지시사항:
  - 핵심 기능을 지원하는 모듈식 아키텍처 설계
  - 표준 웹 기술(Django/React)과 클라우드 서비스(AWS) 활용 방식 정의
  - 데이터베이스 스키마와 API 구조 설계
- 제약조건:
  - MVP 단계에서 제외되는 기능 명확히 구분
  - 선택된 기술 스택 내에서 구현 가능한 범위 설정

#### RIPER 모드 및 사고 프레임워크
- **적용 모드**: [MODE: PLAN]
- **사고 프레임워크**: 순차적 사고를 통한 아키텍처 설계와 모듈 간 관계 정의
- **의사결정 프로세스**: 
  1. 요구사항 문서 분석 (요구사항 식별 및 우선순위 설정)
  2. 시스템 경계 및 모듈 식별 (기능 분해)
  3. 모듈 간 인터페이스 정의 (API 설계)
  4. 데이터 모델 설계 (스키마 정의)
  5. 기술 스택 적합성 검증 (제약조건 평가)

#### 출력 사양
- 형식: 구조화된 텍스트 및 다이어그램
- 구성요소:
  - 시스템 아키텍처 다이어그램
  - 데이터베이스 스키마 정의
  - API 엔드포인트 목록
- 길이/범위: 아키텍처 다이어그램 1개, 스키마 정의 ~20개 테이블, API 엔드포인트 ~30개

### 단계 2: 사용자 관리

#### 목적 및 연결점
- 목적: 다양한 역할(관리자, 강사, 수강생)의 사용자 관리 시스템 구현
- 연결점: 시스템 아키텍처를 기반으로 사용자 인증 및 권한 관리 기능 제공

#### 입력 사양
- 데이터 형식: 시스템 아키텍처 다이어그램, API 명세
- 필수 요소:
  - 사용자 역할 정의(관리자, 강사, 수강생)
  - 권한 체계 설계
  - 인증 메커니즘 요구사항
- 선택 요소:
  - 소셜 로그인 통합 방식
  - 다단계 인증 구현 여부

#### 프롬프트 구조
- 맥락 설정: LMS 플랫폼의 다중 역할 사용자 관리 시스템 구현
- 지시사항:
  - JWT 기반 안전한 인증 시스템 구현
  - 역할 기반 접근 제어(RBAC) 시스템 설계
  - 사용자 프로필 관리 기능 개발
- 제약조건:
  - 모든 인증 통신은 HTTPS 필수
  - 비밀번호 해싱(Bcrypt) 적용

#### RIPER 모드 및 사고 프레임워크
- **적용 모드**: [MODE: RESEARCH]
- **사고 프레임워크**: 다차원적 사고를 통한 사용자 역할과 권한 모델 설계
- **의사결정 프로세스**:
  1. 사용자 타입 및 페르소나 분석 (사용자 요구사항 이해)
  2. 권한 모델 설계 (접근 제어 정책 수립)
  3. 인증 메커니즘 선택 (보안 요구사항 고려)
  4. 확장성 평가 (향후 역할 추가 용이성 검토)
  5. 사용자 경험 최적화 (인증 흐름 단순화)

#### 출력 사양
- 형식: 코드 템플릿 및 API 명세
- 구성요소:
  - 사용자 관리 모듈 구조
  - 인증 API 엔드포인트
  - 권한 관리 로직
- 길이/범위: 코드 템플릿 ~200라인, API 엔드포인트 ~10개

### 단계 3: 강의 관리

#### 목적 및 연결점
- 목적: 강의 콘텐츠 생성, 관리, 구조화 기능 구현
- 연결점: 사용자 관리 시스템과 연동하여 권한에 따른 강의 관리 기능 제공

#### 입력 사양
- 데이터 형식: 사용자 관리 모듈, 시스템 아키텍처
- 필수 요소:
  - 강의 메타데이터 구조
  - 지원할 콘텐츠 형식(비디오, PDF, 이미지 등)
  - 강의 구조화 방식(모듈, 챕터 등)
- 선택 요소:
  - 콘텐츠 버전 관리 방식
  - 메타데이터 태깅 시스템

#### 프롬프트 구조
- 맥락 설정: 다양한 형식의 교육 콘텐츠를 효과적으로 관리하는 시스템 구현
- 지시사항:
  - AWS S3와 통합된 콘텐츠 관리 시스템 구현
  - 모듈/챕터 기반 강의 구조화 기능 개발
  - HLS/DASH 프로토콜을 사용한 비디오 스트리밍 최적화
- 제약조건:
  - 대용량 파일(1GB 이상) 처리 고려
  - 콘텐츠 업로드 진행률 표시 필수

#### RIPER 모드 및 사고 프레임워크
- **적용 모드**: [MODE: IMPLEMENT]
- **사고 프레임워크**: 순차적 사고와 다차원적 사고의 조합을 통한 콘텐츠 구조화
- **의사결정 프로세스**:
  1. 콘텐츠 유형 분석 (지원할 형식 결정)
  2. 구조화 모델 설계 (모듈/챕터 체계 정의)
  3. 저장소 전략 결정 (AWS S3 활용 방식)
  4. 스트리밍 최적화 방안 (프로토콜 선택)
  5. 콘텐츠 접근 제어 (권한 모델과 통합)

#### 출력 사양
- 형식: 코드 템플릿 및 기술 명세
- 구성요소:
  - 강의 관리 모듈 구조
  - S3 통합 코드
  - 콘텐츠 스트리밍 설정
- 길이/범위: 코드 템플릿 ~250라인, 기술 명세 ~15항목

### 단계 4: 수강 관리

#### 목적 및 연결점
- 목적: 강의 등록, 접근 제어, 카탈로그 관리 기능 구현
- 연결점: 사용자 관리 및 강의 관리 시스템과 연동하여 수강 프로세스 관리

#### 입력 사양
- 데이터 형식: 사용자 관리 모듈, 강의 관리 모듈
- 필수 요소:
  - 수강 등록 프로세스 정의
  - 접근 제어 정책
  - 강의 카탈로그 구조
- 선택 요소:
  - 등록 승인 워크플로우
  - 대기 목록 관리

#### 프롬프트 구조
- 맥락 설정: 사용자가 강의를 탐색하고 등록하는 프로세스 구현
- 지시사항:
  - 카테고리별 강의 탐색 기능 개발
  - 사용자-강의 매핑 테이블 구현
  - 접근 제어 로직 및 API 개발
- 제약조건:
  - 대량 동시 등록 처리 고려
  - 결제 기능은 MVP 이후 단계로 연기

#### RIPER 모드 및 사고 프레임워크
- **적용 모드**: [MODE: IMPLEMENT]
- **사고 프레임워크**: 순차적 사고를 통한 수강 프로세스 흐름 설계
- **의사결정 프로세스**:
  1. 수강 워크플로우 정의 (등록부터 완료까지)
  2. 관계 모델 설계 (사용자-강의 매핑)
  3. 카탈로그 구성 전략 (검색 및 필터링 최적화)
  4. 대량 처리 최적화 (성능 고려사항)
  5. 접근 제어 통합 (권한 모델 적용)

#### 출력 사양
- 형식: 코드 템플릿 및 API 명세
- 구성요소:
  - 수강 관리 모듈 구조
  - 사용자-강의 매핑 스키마
  - 접근 제어 로직
- 길이/범위: 코드 템플릿 ~200라인, API 엔드포인트 ~8개

### 단계 5: 학습 경험

#### 목적 및 연결점
- 목적: 진도 추적, 평가 도구를 통한 학습 경험 최적화
- 연결점: 수강 관리 시스템과 연동하여 학습 과정 및 성과 관리

#### 입력 사양
- 데이터 형식: 수강 관리 모듈, 강의 구조 정보
- 필수 요소:
  - 진도 추적 메커니즘
  - 평가 도구 요구사항(퀴즈 유형, 자동 채점 등)
  - 학습 데이터 수집 범위
- 선택 요소:
  - 학습 분석 메트릭
  - 맞춤형 학습 경로 제안 로직

#### 프롬프트 구조
- 맥락 설정: 학습자의 진행 상황을 추적하고 평가하는 시스템 구현
- 지시사항:
  - 모듈/챕터별 진도 추적 및 시각화 구현
  - 다양한 퀴즈 유형(객관식, 주관식) 지원 시스템 개발
  - WebSocket을 활용한 실시간 진도 업데이트 구현
- 제약조건:
  - 진도 데이터 손실 방지를 위한 안정적 저장 메커니즘 필요
  - 객관식 문항 자동 채점 기능 필수

#### RIPER 모드 및 사고 프레임워크
- **적용 모드**: [MODE: ANALYZE]
- **사고 프레임워크**: 다차원적 사고를 통한 학습 경험 설계와 성과 측정
- **의사결정 프로세스**:
  1. 학습 패턴 분석 (효과적인 진도 추적 방식 결정)
  2. 평가 모델 설계 (문제 유형 및 채점 기준)
  3. 데이터 수집 전략 (학습 행동 분석 지표)
  4. 실시간성 요구사항 평가 (WebSocket 적용 범위)
  5. 개인화 접근 방식 (맞춤형 학습 경로 설계)

#### 출력 사양
- 형식: 코드 템플릿 및 기술 명세
- 구성요소:
  - 진도 추적 모듈 구조
  - 퀴즈 생성 및 채점 로직
  - 학습자 대시보드 컴포넌트
- 길이/범위: 코드 템플릿 ~250라인, UI 컴포넌트 ~10개

### 단계 6: 통합 도구

#### 목적 및 연결점
- 목적: AI 챗봇, 커뮤니케이션, 수료증 발급 등 보조 기능 구현
- 연결점: 기존 모듈과 통합하여 학습 경험을 향상시키는 도구 제공

#### 입력 사양
- 데이터 형식: 사용자/강의/수강/학습 모듈 정보
- 필수 요소:
  - AI 챗봇 요구사항
  - 커뮤니케이션 채널 정의
  - 수료증 템플릿 및 발급 조건
- 선택 요소:
  - 알림 설정 옵션
  - 수료증 검증 메커니즘

#### 프롬프트 구조
- 맥락 설정: 학습 경험을 향상시키는 보조 도구 구현
- 지시사항:
  - OpenAI ChatGPT API를 활용한 AI 챗봇 구현
  - Q&A 게시판 및 알림 시스템 개발
  - 자동 PDF 수료증 생성 및 발급 기능 구현
- 제약조건:
  - 챗봇 대화 로그 저장 및 관리 필요
  - 수료증 위변조 방지 장치 구현

#### RIPER 모드 및 사고 프레임워크
- **적용 모드**: [MODE: INTEGRATE]
- **사고 프레임워크**: 순차적 사고와 다차원적 사고의 조합을 통한 통합 도구 설계
- **의사결정 프로세스**:
  1. 챗봇 지식 범위 정의 (콘텐츠 기반 컨텍스트 설계)
  2. 소통 채널 전략 수립 (실시간/비동기 소통 방식)
  3. 인증 체계 설계 (수료증 신뢰성 확보)
  4. 외부 서비스 통합 접근법 (OpenAI API 연동)
  5. 사용자 경험 통합 (기존 모듈과의 일관성 유지)

#### 출력 사양
- 형식: 코드 템플릿 및 통합 명세
- 구성요소:
  - AI 챗봇 통합 코드
  - 커뮤니케이션 모듈 구조
  - 수료증 생성 로직
- 길이/범위: 코드 템플릿 ~300라인, API 통합 ~5개

### 단계 7: 관리자 대시보드

#### 목적 및 연결점
- 목적: 플랫폼 운영 및 분석을 위한 통계 및 관리 도구 제공
- 연결점: 모든 모듈의 데이터를 수집하여 관리자에게 인사이트 제공

#### 입력 사양
- 데이터 형식: 모든 모듈의 집계 데이터
- 필수 요소:
  - 주요 통계 메트릭 정의
  - 관리 기능 요구사항
  - 데이터 시각화 방식
- 선택 요소:
  - 예측 분석 지표
  - 데이터 내보내기 옵션

#### 프롬프트 구조
- 맥락 설정: 플랫폼 운영 현황을 종합적으로 파악할 수 있는 대시보드 구현
- 지시사항:
  - Chart.js를 활용한 주요 통계 시각화 구현
  - 사용자 관리 및 활동 로그 조회 기능 개발
  - WebSocket을 통한 실시간 데이터 업데이트 구현
- 제약조건:
  - 대량 데이터 처리 시 성능 최적화 필요
  - 권한에 따른 데이터 접근 제한 필수

#### RIPER 모드 및 사고 프레임워크
- **적용 모드**: [MODE: ANALYZE]
- **사고 프레임워크**: 다차원적 사고를 통한 데이터 시각화 및 인사이트 도출
- **의사결정 프로세스**:
  1. 핵심 지표 식별 (KPI 및 운영 메트릭 정의)
  2. 시각화 전략 수립 (적절한 차트 유형 선택)
  3. 데이터 집계 프로세스 설계 (성능과 정확성 균형)
  4. 실시간성 요구사항 평가 (업데이트 빈도 설정)
  5. 접근 제어 모델 적용 (역할 기반 데이터 접근)

#### 출력 사양
- 형식: 코드 템플릿 및 UI 명세
- 구성요소:
  - 대시보드 모듈 구조
  - 데이터 시각화 컴포넌트
  - 관리 기능 인터페이스
- 길이/범위: 코드 템플릿 ~250라인, UI 컴포넌트 ~12개

## 데이터 흐름 및 통합

### 모듈 간 데이터 전달 방식
- **API 기반 통신**:
  - RESTful API를 통한 모듈 간 데이터 교환
  - JWT 토큰 기반 인증 및 권한 검증
  - JSON 포맷의 요청/응답 구조 표준화

- **이벤트 기반 통신**:
  - 중요 이벤트(등록, 완료 등) 발생 시 이벤트 발행
  - WebSocket을 통한 실시간 알림 및 업데이트
  - Redis 기반 이벤트 큐 활용

- **데이터베이스 공유**:
  - 중앙 PostgreSQL 데이터베이스를 통한 데이터 접근
  - 외래 키를 통한 모듈 간 관계 정의
  - 트랜잭션 관리를 통한 데이터 일관성 보장

### 외부 서비스 통합
- **AWS S3 통합**:
  - 콘텐츠 파일 저장 및 관리
  - 서명된 URL을 통한 안전한 파일 접근
  - 파일 메타데이터는 데이터베이스에 저장

- **OpenAI API 통합**:
  - AI 챗봇 구현을 위한 ChatGPT API 활용
  - 대화 컨텍스트 관리 및 저장
  - 캐싱을 통한 API 호출 최적화

- **통신 서비스 통합**:
  - SendGrid를 통한 이메일 알림 발송
  - Twilio를 통한 SMS 알림 발송 (선택적)
  - 템플릿 기반 커뮤니케이션 관리

### 모듈별 입출력 관계 요약표
| 모듈 | 입력 | 출력 | 통합 포인트 | RIPER 모드 |
|------|------|------|------------|------------|
| 사용자 관리 | 등록 정보, 인증 요청 | 사용자 정보, 토큰 | Auth API, DB | RESEARCH |
| 강의 관리 | 강의 정보, 콘텐츠 | 강의 구조, URL | S3, DB | IMPLEMENT |
| 수강 관리 | 사용자 ID, 강의 ID | 수강 정보, 접근 권한 | DB, API | IMPLEMENT |
| 학습 경험 | 수강 정보, 학습 활동 | 진도 데이터, 평가 결과 | WebSocket, DB | ANALYZE |
| 통합 도구 | 사용자 질문, 학습 성과 | 챗봇 응답, 수료증 | OpenAI, S3 | INTEGRATE |
| 관리자 대시보드 | 모든 모듈 데이터 | 통계, 시각화, 관리 UI | WebSocket, DB | ANALYZE |

## 검증 및 품질 관리

### 모듈별 검증 방법
- **사용자 관리**:
  - 인증 흐름 테스트(로그인, 로그아웃, 비밀번호 재설정)
  - 권한 기반 접근 제어 테스트
  - 계정 관리 기능 테스트

- **강의 관리**:
  - 다양한 파일 형식 업로드 테스트
  - 콘텐츠 구조화 및 조직화 테스트
  - 스트리밍 성능 및 안정성 테스트

- **수강 관리**:
  - 등록 프로세스 테스트
  - 접근 제어 정책 테스트
  - 강의 탐색 및 검색 기능 테스트

- **학습 경험**:
  - 진도 추적 정확성 테스트
  - 퀴즈 생성 및 채점 테스트
  - 학습 데이터 수집 및 저장 테스트

- **통합 도구**:
  - AI 챗봇 응답 품질 테스트
  - 알림 전송 및 수신 테스트
  - 수료증 생성 및 검증 테스트

- **관리자 대시보드**:
  - 데이터 시각화 정확성 테스트
  - 실시간 업데이트 테스트
  - 관리 기능 작동 테스트

### 통합 검증 방법
- **엔드투엔드 테스트**:
  - 주요 사용자 시나리오 기반 테스트
  - 모듈 간 데이터 흐름 테스트
  - API 응답 및 오류 처리 테스트

- **성능 테스트**:
  - 부하 테스트(동시 사용자 100명 이상)
  - 응답 시간 테스트(API 응답 500ms 이내)
  - 리소스 사용량 모니터링

- **보안 테스트**:
  - 인증 및 권한 검증
  - 데이터 암호화 검증
  - 취약점 스캔 및 평가

### 품질 체크리스트
| 검증 항목 | 성공 기준 | 검증 방법 | RIPER 모드 |
|----------|----------|----------|------------|
| 기능 완성도 | 9개 핵심 기능 모두 작동 | 기능별 테스트 | IMPLEMENT |
| API 응답 시간 | 평균 500ms 이내 | 성능 테스트 | ANALYZE |
| 데이터 일관성 | 트랜잭션 완전성 100% | 통합 테스트 | RESEARCH |
| UI 반응성 | 동작 지연 없음 | 사용성 테스트 | IMPLEMENT |
| 모바일 호환성 | 주요 모바일 기기 지원 | 크로스 테스트 | IMPLEMENT |
| 보안 적합성 | 취약점 없음 | 보안 감사 | RESEARCH |
| 확장성 | 사용자/콘텐츠 증가 대응 | 스케일링 테스트 | PLAN |

## 리소스 및 제한사항

### 필요 도구 및 API
- **백엔드**: Django, Django REST Framework
- **프론트엔드**: React, Redux, Chart.js
- **데이터베이스**: PostgreSQL, Redis(캐싱)
- **스토리지**: AWS S3
- **AI 서비스**: OpenAI ChatGPT API
- **통신 서비스**: SendGrid(이메일), Twilio(SMS, 선택적)
- **배포 환경**: AWS EC2, Docker, Nginx

### 성능 및 규모 제한
- **동시 사용자**: MVP 단계에서 100명 이상 지원
- **콘텐츠 용량**: 사용자당 최대 5GB 스토리지
- **API 응답 시간**: 평균 500ms 이내
- **페이지 로딩 시간**: 2초 이내
- **화면 해상도**: 최소 320px(모바일) ~ 1920px(데스크톱) 지원

### 확장성 및 유지보수 지침
- **모듈화 설계**: 각 기능을 독립적인 모듈로 개발하여 확장성 확보
- **API 버전 관리**: API 엔드포인트에 버전 명시로 호환성 유지
- **로깅 표준화**: 일관된 로깅 형식으로 문제 진단 용이성 확보
- **문서화**: API 문서, 코드 주석, 사용자 가이드 작성
- **CI/CD 파이프라인**: 자동화된 테스트 및 배포 체계 구축

### 제외 기능 (향후 확장)
- **CRM 연동**: Zapier 또는 API를 통한 외부 CRM 통합
- **고급 추천 시스템**: 머신러닝 기반 개인화 콘텐츠 추천
- **게임화 요소**: 배지, 포인트, 리더보드 등 학습 동기 부여 기능
- **결제 시스템**: Stripe 등을 통한 유료 강의 및 구독 모델
- **멀티 언어 지원**: 국제화 및 현지화 기능