#!/bin/bash

# Docker 컨테이너 재빌드 스크립트
echo "🐳 AI-LMS Frontend Docker 재빌드 시작..."

# 현재 실행 중인 컨테이너 확인 및 중지
echo "📋 현재 실행 중인 컨테이너 확인..."
docker ps

echo ""
echo "🛑 기존 컨테이너 중지 중..."
docker stop ai-lms-frontend 2>/dev/null || echo "중지할 컨테이너가 없습니다."

echo "🗑️ 기존 컨테이너 제거 중..."
docker rm ai-lms-frontend 2>/dev/null || echo "제거할 컨테이너가 없습니다."

echo "🗑️ 기존 이미지 제거 중..."
docker rmi ai-lms-frontend:latest 2>/dev/null || echo "제거할 이미지가 없습니다."

echo ""
echo "🔨 새 Docker 이미지 빌드 중..."
docker build --platform linux/amd64 -t ai-lms-frontend:latest -f Dockerfile .

if [ $? -eq 0 ]; then
    echo "✅ Docker 이미지 빌드 성공!"
    
    echo ""
    echo "🚀 새 컨테이너 실행 중..."
    docker run -d --name ai-lms-frontend -p 3000:80 ai-lms-frontend:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker 컨테이너 실행 성공!"
        echo ""
        echo "📋 컨테이너 상태 확인:"
        docker ps | grep ai-lms-frontend
        echo ""
        echo "🌐 애플리케이션 접속: http://localhost:3000"
        echo ""
        echo "📊 컨테이너 로그 확인: docker logs ai-lms-frontend"
        echo "🛑 컨테이너 중지: docker stop ai-lms-frontend"
    else
        echo "❌ Docker 컨테이너 실행 실패!"
        exit 1
    fi
else
    echo "❌ Docker 이미지 빌드 실패!"
    echo ""
    echo "🔍 문제 해결 방법:"
    echo "1. package.json 문제: npm install 실행"
    echo "2. 환경 변수 문제: .env 파일 확인"
    echo "3. 빌드 오류: npm run build 로컬 테스트"
    exit 1
fi

echo ""
echo "🎉 Docker 재빌드 완료!"