#!/bin/bash

echo "Simple deployment for GCP free tier..."

VM_INSTANCE="freetier-instance"
VM_ZONE="us-west1-a"

# 로컬에서 프론트엔드 빌드
echo "Building frontend locally..."
cd src/frontend && npm run build && cd ../..

# 빌드 파일만 압축
echo "Creating lightweight package..."
tar -czf frontend-build.tar.gz -C src/frontend/build .

# VM에 업로드
gcloud compute scp frontend-build.tar.gz $VM_INSTANCE:~/ --zone=$VM_ZONE

# 간단한 nginx 서버로 배포
gcloud compute ssh $VM_INSTANCE --zone=$VM_ZONE --command="
    # nginx 설치
    sudo apt update && sudo apt install -y nginx
    
    # 기존 파일 삭제
    sudo rm -rf /var/www/html/*
    
    # 새 파일 압축해제
    cd /var/www/html
    sudo tar -xzf ~/frontend-build.tar.gz
    
    # nginx 시작
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    echo 'Simple deployment completed!'
"

rm frontend-build.tar.gz
echo "Frontend deployed at: http://34.169.188.73"