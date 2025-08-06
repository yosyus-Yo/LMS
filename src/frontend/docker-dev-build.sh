#!/bin/bash

# 개발환경용 Docker 빌드 및 실행 스크립트
# 캐시 문제 해결을 위한 강제 리빌드

echo "🔄 개발환경 Docker 컨테이너 빌드 및 실행"
echo "⚠️  캐시 방지를 위해 --no-cache 옵션 사용"

# 기존 컨테이너 중지 및 삭제
echo "🛑 기존 컨테이너 중지 및 삭제..."
docker stop ai-lms-frontend-dev 2>/dev/null || true
docker rm ai-lms-frontend-dev 2>/dev/null || true

# 기존 이미지 삭제 (캐시 방지)
echo "🗑️ 기존 이미지 삭제..."
docker rmi ai-lms-frontend:dev 2>/dev/null || true

# 새로운 이미지 빌드 (캐시 없이)
echo "🔨 새로운 이미지 빌드 중..."
docker build \
  --no-cache \
  --platform linux/amd64 \
  -f Dockerfile.dev \
  -t ai-lms-frontend:dev .

# 빌드 성공 확인
if [ $? -eq 0 ]; then
  echo "✅ 빌드 성공!"
  
  # 컨테이너 실행
  echo "🚀 컨테이너 실행 중..."
  docker run -d \
    --name ai-lms-frontend-dev \
    -p 3000:80 \
    --platform linux/amd64 \
    ai-lms-frontend:dev
  
  echo "🎉 컨테이너가 실행되었습니다!"
  echo "📱 브라우저에서 http://localhost:3000 으로 접속하세요"
  echo ""
  echo "💡 팁:"
  echo "  - 변경사항이 반영되지 않으면 이 스크립트를 다시 실행하세요"
  echo "  - 브라우저에서 Ctrl+F5 (하드 리프레시)를 시도해보세요"
  echo "  - 시크릿 모드를 사용하면 캐시 문제를 피할 수 있습니다"
  
else
  echo "❌ 빌드 실패!"
  exit 1
fi