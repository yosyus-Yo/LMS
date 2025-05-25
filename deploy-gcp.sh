#!/bin/bash

# GCP VM 배포 스크립트
echo "Starting deployment to GCP VM..."

# 변수 설정
VM_INSTANCE="freetier-instance"
VM_ZONE="us-west1-a"  # 실제 zone으로 변경 필요
VM_IP="34.169.188.73"
DOMAIN="learningsoft.uk"

# gcloud 인증 확인
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "gcloud authentication required. Please run: gcloud auth login"
    exit 1
fi

# 프로젝트 압축
echo "Creating deployment package..."
tar --exclude='node_modules' --exclude='venv' --exclude='.git' --exclude='*.pyc' --exclude='__pycache__' -czf lms-app.tar.gz .

# GCP VM으로 파일 전송
echo "Uploading files to GCP VM..."
gcloud compute scp lms-app.tar.gz $VM_INSTANCE:~/ --zone=$VM_ZONE

# GCP VM에서 배포 실행
echo "Deploying on GCP VM..."
gcloud compute ssh $VM_INSTANCE --zone=$VM_ZONE --command="
    # 기존 컨테이너 정리
    sudo docker-compose down 2>/dev/null || true
    
    # 새 파일 압축해제
    rm -rf lms-app
    mkdir lms-app
    tar -xzf lms-app.tar.gz -C lms-app
    cd lms-app
    
    # Docker 및 Docker Compose 설치 (필요시)
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker \$USER
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Docker 이미지 빌드 및 실행
    sudo docker-compose build
    sudo docker-compose up -d
    
    # 정리
    cd ..
    rm lms-app.tar.gz
    
    echo 'Deployment completed!'
"

# 로컬 임시 파일 정리
rm lms-app.tar.gz

echo "Deployment completed!"
echo "Application should be available at: http://$DOMAIN"
echo "VM External IP: $VM_IP"