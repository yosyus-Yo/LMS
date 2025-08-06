# 🚀 Docker 개발환경 캐시 문제 해결 가이드

## 🤔 **문제 상황**
Docker로 재배포했는데 변경사항이 바로 반영되지 않고, 시크릿 모드로 들어가야 적용되는 현상

## ✅ **해결 방법들**

### 1. **개발용 Docker 빌드 스크립트 사용** (가장 효과적)

```bash
# 실행 권한 부여
chmod +x docker-dev-build.sh

# 스크립트 실행
./docker-dev-build.sh
```

이 스크립트는:
- 기존 컨테이너/이미지 완전 삭제
- `--no-cache` 옵션으로 강제 리빌드
- 캐시 방지 nginx 설정 적용

### 2. **수동 캐시 클리어 방법**

#### 브라우저에서:
- **하드 리프레시**: `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
- **개발자도구**: F12 → Network 탭 → "Disable cache" 체크
- **시크릿/인코그니토 모드** 사용

#### Docker에서:
```bash
# 모든 캐시 제거 후 리빌드
docker system prune -f
docker build --no-cache -f Dockerfile.dev -t ai-lms-frontend:dev .
docker run -d --name ai-lms-frontend-dev -p 3000:80 ai-lms-frontend:dev
```

### 3. **nginx 설정 변경**

개발환경에서는 `nginx.dev.conf` 사용:
```nginx
# 모든 캐시 완전 비활성화
add_header Cache-Control "no-cache, no-store, must-revalidate" always;
add_header Pragma "no-cache" always;
add_header Expires "0" always;
```

### 4. **빌드 타임스탬프 추가**

매 빌드마다 고유한 식별자 생성으로 캐시 무력화:
```dockerfile
ENV REACT_APP_BUILD_TIME=$(date +%s)
```

## 🔧 **개발 워크플로우 권장사항**

### 매일 작업 시작 시:
```bash
# 1. 최신 코드 pull
git pull origin main

# 2. 캐시 없이 완전 리빌드
./docker-dev-build.sh

# 3. 브라우저 하드 리프레시
# Ctrl+F5 또는 Cmd+Shift+R
```

### 변경사항 확인이 안 될 때:
1. **첫 번째 시도**: 브라우저 하드 리프레시 (`Ctrl+F5`)
2. **두 번째 시도**: 시크릿 모드로 접속
3. **세 번째 시도**: `./docker-dev-build.sh` 재실행

## 💡 **왜 이런 일이 발생하나요?**

### 캐시 레이어들:
1. **브라우저 캐시**: HTML, CSS, JS 파일들
2. **Service Worker**: React 앱의 오프라인 캐시
3. **Docker 레이어 캐시**: 이미지 빌드 캐시
4. **nginx 캐시**: 웹서버 레벨 캐시

### 개발 vs 프로덕션:
- **개발환경**: 빠른 반영이 중요 → 캐시 비활성화
- **프로덕션**: 성능이 중요 → 적극적 캐시 활용

## 🚨 **프로덕션 배포 시 주의사항**

프로덕션에서는 캐시가 **성능에 매우 중요**합니다:

```nginx
# 프로덕션용 nginx.conf
location /static/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## 📝 **추가 팁**

### 개발자 도구 활용:
1. F12 → Network 탭
2. "Disable cache" 체크박스 활성화
3. 새로고침 시 항상 최신 파일 다운로드

### Chrome 확장프로그램:
- "Clear Cache" 등의 확장프로그램 사용
- 원클릭으로 캐시 클리어 가능

### VS Code에서:
```json
// .vscode/settings.json
{
  "liveServer.settings.NoBrowser": true,
  "liveServer.settings.CustomBrowser": "chrome:PrivateMode"
}
```

## 🎯 **결론**

개발환경에서의 캐시 문제는 **매우 일반적**입니다. 
- 💻 **개발할 때**: 캐시 비활성화로 빠른 피드백
- 🚀 **배포할 때**: 캐시 활성화로 최적 성능

이 가이드의 방법들을 사용하면 더 이상 시크릿 모드에 의존하지 않아도 됩니다! 🎉