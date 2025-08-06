#!/bin/bash

# GCP Compute Engine에서 AI-LMS 배포 스크립트

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정 변수들 (수정 필요)
PROJECT_ID="your-gcp-project-id"
INSTANCE_NAME="ai-lms-server"
ZONE="asia-northeast3-a"
MACHINE_TYPE="e2-standard-2"
IMAGE_NAME="ai-lms"

echo -e "${BLUE}🚀 GCP에 AI-LMS 배포 시작${NC}"

# 1. Compute Engine 인스턴스 생성
echo -e "${YELLOW}🖥️  Compute Engine 인스턴스 생성 중...${NC}"
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  인스턴스가 이미 존재합니다. 기존 인스턴스를 사용합니다.${NC}"
else
    gcloud compute instances create $INSTANCE_NAME \
      --zone=$ZONE \
      --machine-type=$MACHINE_TYPE \
      --boot-disk-size=50GB \
      --boot-disk-type=pd-standard \
      --image-family=cos-stable \
      --image-project=cos-cloud \
      --tags=http-server,https-server \
      --scopes=https://www.googleapis.com/auth/cloud-platform
    
    echo -e "${GREEN}✅ 인스턴스 생성 완료${NC}"
fi

# 2. 방화벽 규칙 생성
echo -e "${YELLOW}🔥 방화벽 규칙 확인 중...${NC}"
if gcloud compute firewall-rules describe allow-ai-lms-http >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  방화벽 규칙이 이미 존재합니다.${NC}"
else
    gcloud compute firewall-rules create allow-ai-lms-http \
      --allow tcp:80,tcp:443 \
      --source-ranges 0.0.0.0/0 \
      --target-tags http-server \
      --description "Allow HTTP and HTTPS traffic for AI-LMS"
    
    echo -e "${GREEN}✅ 방화벽 규칙 생성 완료${NC}"
fi

# 3. 인스턴스가 실행될 때까지 대기
echo -e "${YELLOW}⏳ 인스턴스 시작 대기 중...${NC}"
gcloud compute instances start $INSTANCE_NAME --zone=$ZONE 2>/dev/null || true
sleep 30

# 4. 인스턴스에 Docker 명령 실행
echo -e "${YELLOW}🐳 인스턴스에서 Docker 컨테이너 실행 중...${NC}"
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    # Docker registry 인증
    gcloud auth configure-docker --quiet
    
    # 기존 컨테이너 정리
    docker stop ai-lms 2>/dev/null || true
    docker rm ai-lms 2>/dev/null || true
    
    # 새 컨테이너 실행
    docker run -d \
      --name ai-lms \
      --restart unless-stopped \
      -p 80:80 \
      gcr.io/$PROJECT_ID/$IMAGE_NAME:latest
    
    # 컨테이너 상태 확인
    echo '컨테이너 상태:'
    docker ps | grep ai-lms
"

# 5. 외부 IP 확인
echo -e "${YELLOW}🌐 외부 IP 주소 확인 중...${NC}"
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo -e "${GREEN}🎉 배포 완료!${NC}"
echo -e "${BLUE}📋 배포 정보:${NC}"
echo "  - 인스턴스: $INSTANCE_NAME"
echo "  - 영역: $ZONE"
echo "  - 외부 IP: $EXTERNAL_IP"
echo "  - 접속 URL: http://$EXTERNAL_IP"

echo -e "${YELLOW}🔍 유용한 명령어들:${NC}"
echo "  인스턴스 SSH 접속: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "  로그 확인: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='docker logs ai-lms'"
echo "  컨테이너 재시작: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='docker restart ai-lms'"
echo "  인스턴스 정지: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"