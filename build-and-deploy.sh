#!/bin/bash

echo "Starting local build and deployment..."

# 변수 설정
VM_INSTANCE="freetier-instance"
VM_ZONE="us-west1-a"
VM_IP="34.169.188.73"
DOMAIN="learningsoft.uk"

# 1. 로컬에서 프론트엔드 빌드
echo "Building frontend locally..."
cd src/frontend
npm run build
cd ../..

# 2. 빌드된 파일과 함께 압축
echo "Creating deployment package with pre-built frontend..."
tar --exclude='node_modules' --exclude='venv' --exclude='.git' --exclude='*.pyc' --exclude='__pycache__' \
    --exclude='src/frontend/node_modules' \
    -czf lms-app.tar.gz .

# 3. GCP VM으로 파일 전송
echo "Uploading files to GCP VM..."
gcloud compute scp lms-app.tar.gz $VM_INSTANCE:~/ --zone=$VM_ZONE

# 4. 간단한 Docker 설정으로 배포
echo "Deploying on GCP VM..."
gcloud compute ssh $VM_INSTANCE --zone=$VM_ZONE --command="
    # 기존 컨테이너 정리
    sudo docker-compose down 2>/dev/null || true
    
    # 새 파일 압축해제
    rm -rf lms-app
    mkdir lms-app
    tar -xzf lms-app.tar.gz -C lms-app
    cd lms-app
    
    # Docker 및 Docker Compose 설치 확인
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker \$USER
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L \"https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64\" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # 빌드 없이 바로 실행
    sudo docker-compose up -d --build
    
    # 정리
    cd ..
    rm lms-app.tar.gz
    
    echo 'Deployment completed!'
"

# 로컬 임시 파일 정리
rm lms-app.tar.gz

echo "Deployment completed!"
echo "Application should be available at: http://$DOMAIN"