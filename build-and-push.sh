#!/bin/bash

# AI-LMS Docker 빌드 및 GCP 푸시 스크립트

set -e  # 에러 발생시 스크립트 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정 변수들 (수정 필요)
PROJECT_ID="your-gcp-project-id"
IMAGE_NAME="ai-lms"
VERSION="v1.0.0"

# Supabase 설정 (새로운 값으로 변경)
SUPABASE_URL="https://your-new-project.supabase.co"
SUPABASE_ANON_KEY="your-new-anon-key"

echo -e "${BLUE}🚀 AI-LMS Docker 빌드 및 배포 시작${NC}"

# 1. 프로젝트 디렉토리로 이동
echo -e "${YELLOW}📁 프로젝트 디렉토리로 이동...${NC}"
cd "$(dirname "$0")/src/frontend"

# 2. Docker 이미지 빌드
echo -e "${YELLOW}🔨 Docker 이미지 빌드 중...${NC}"
docker build \
  --build-arg REACT_APP_NAME="AI-LMS" \
  --build-arg REACT_APP_VERSION="1.0.0" \
  --build-arg REACT_APP_SUPABASE_URL="$SUPABASE_URL" \
  --build-arg REACT_APP_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --build-arg REACT_APP_NICEPAY_CLIENT_ID="your_nicepay_client_id" \
  --build-arg REACT_APP_NICEPAY_MODE="production" \
  --build-arg REACT_APP_EMAILJS_SERVICE_ID="service_9fheut7" \
  --build-arg REACT_APP_EMAILJS_TEMPLATE_ID="template_fhhyjai" \
  --build-arg REACT_APP_EMAILJS_PUBLIC_KEY="4nNvMDfN3rKNgaDur" \
  --build-arg REACT_APP_GROQ_API_KEY="${GROQ_API_KEY}" \
  -t $IMAGE_NAME:latest \
  -t $IMAGE_NAME:$VERSION .

echo -e "${GREEN}✅ Docker 이미지 빌드 완료${NC}"

# 3. GCP 태깅
echo -e "${YELLOW}🏷️  GCP Container Registry용 태깅...${NC}"
docker tag $IMAGE_NAME:latest gcr.io/$PROJECT_ID/$IMAGE_NAME:latest
docker tag $IMAGE_NAME:$VERSION gcr.io/$PROJECT_ID/$IMAGE_NAME:$VERSION

# 4. GCP 인증 확인
echo -e "${YELLOW}🔐 GCP 인증 확인...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ GCP 인증이 필요합니다. 다음 명령을 실행하세요:${NC}"
    echo "gcloud auth login"
    echo "gcloud config set project $PROJECT_ID"
    exit 1
fi

# 5. Docker registry 인증
echo -e "${YELLOW}🐳 Docker registry 인증...${NC}"
gcloud auth configure-docker --quiet

# 6. 이미지 푸시
echo -e "${YELLOW}📤 Container Registry에 이미지 푸시 중...${NC}"
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$VERSION

echo -e "${GREEN}🎉 빌드 및 푸시 완료!${NC}"
echo -e "${BLUE}📋 푸시된 이미지:${NC}"
echo "  - gcr.io/$PROJECT_ID/$IMAGE_NAME:latest"
echo "  - gcr.io/$PROJECT_ID/$IMAGE_NAME:$VERSION"

echo -e "${YELLOW}🚀 다음 단계: GCP 인스턴스에서 다음 명령으로 실행하세요:${NC}"
echo "docker run -d --name ai-lms --restart unless-stopped -p 80:80 gcr.io/$PROJECT_ID/$IMAGE_NAME:latest"