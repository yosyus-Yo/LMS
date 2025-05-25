#!/bin/bash

# 배포 스크립트
echo "Starting deployment..."

# 변수 설정
EC2_HOST="34.169.188.73"  # EC2 IP 주소
EC2_USER="freetier-instance"       # EC2 사용자명
KEY_PATH="~/.ssh/gcp-vm-key"  # GCP SSH 키 파일 경로
DOMAIN="learningsoft.uk"  # 실제 도메인

# 프로젝트 압축
echo "Creating deployment package..."
tar --exclude='node_modules' --exclude='venv' --exclude='.git' --exclude='*.pyc' -czf lms-app.tar.gz .

# EC2로 파일 전송
echo "Uploading files to EC2..."
scp -i $KEY_PATH lms-app.tar.gz $EC2_USER@$EC2_HOST:~/

# EC2에서 배포 실행
echo "Deploying on EC2..."
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
    # 기존 컨테이너 정리
    sudo docker-compose down || true
    
    # 새 파일 압축해제
    rm -rf lms-app
    mkdir lms-app
    tar -xzf lms-app.tar.gz -C lms-app
    cd lms-app
    
    # Docker 이미지 빌드 및 실행
    sudo docker-compose build
    sudo docker-compose up -d
    
    # 정리
    cd ..
    rm lms-app.tar.gz
EOF

# 로컬 임시 파일 정리
rm lms-app.tar.gz

echo "Deployment completed!"
echo "Application should be available at: http://$DOMAIN"