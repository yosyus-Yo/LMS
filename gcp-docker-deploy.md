# GCP Docker 배포 가이드

## 🚀 전체 배포 과정

### 1. Docker 이미지 빌드 및 태깅

```bash
# 1-1. 새로운 Supabase 환경변수로 Docker 이미지 빌드
cd /Users/seohun/Documents/LMS\ \(1\)/src/frontend

docker build \
  --build-arg REACT_APP_NAME="AI-LMS" \
  --build-arg REACT_APP_VERSION="1.0.0" \
  --build-arg REACT_APP_SUPABASE_URL="https://your-new-project.supabase.co" \
  --build-arg REACT_APP_SUPABASE_ANON_KEY="your-new-anon-key" \
  --build-arg REACT_APP_NICEPAY_CLIENT_ID="your_nicepay_client_id" \
  --build-arg REACT_APP_NICEPAY_MODE="production" \
  --build-arg REACT_APP_EMAILJS_SERVICE_ID="service_9fheut7" \
  --build-arg REACT_APP_EMAILJS_TEMPLATE_ID="template_fhhyjai" \
  --build-arg REACT_APP_EMAILJS_PUBLIC_KEY="4nNvMDfN3rKNgaDur" \
  --build-arg REACT_APP_GROQ_API_KEY="<YOUR_GROQ_API_KEY>" \
  -t ai-lms:latest .

# 1-2. GCP Container Registry용 태깅
# 프로젝트 ID를 자신의 것으로 변경하세요
export PROJECT_ID="your-gcp-project-id"
docker tag ai-lms:latest gcr.io/$PROJECT_ID/ai-lms:latest
docker tag ai-lms:latest gcr.io/$PROJECT_ID/ai-lms:v1.0.0
```

### 2. Google Container Registry에 푸시

```bash
# 2-1. GCP 인증 (gcloud CLI 필요)
gcloud auth login
gcloud config set project $PROJECT_ID

# 2-2. Docker registry 인증 설정
gcloud auth configure-docker

# 2-3. 이미지 푸시
docker push gcr.io/$PROJECT_ID/ai-lms:latest
docker push gcr.io/$PROJECT_ID/ai-lms:v1.0.0
```

### 3. GCP Compute Engine 인스턴스 생성

```bash
# 3-1. Compute Engine 인스턴스 생성
gcloud compute instances create ai-lms-server \
  --zone=asia-northeast3-a \
  --machine-type=e2-standard-2 \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-standard \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --tags=http-server,https-server \
  --scopes=https://www.googleapis.com/auth/cloud-platform

# 3-2. 방화벽 규칙 생성 (HTTP/HTTPS 허용)
gcloud compute firewall-rules create allow-ai-lms-http \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server \
  --description "Allow HTTP and HTTPS traffic for AI-LMS"
```

### 4. 인스턴스에 접속하여 Docker 실행

```bash
# 4-1. SSH 접속
gcloud compute ssh ai-lms-server --zone=asia-northeast3-a

# 4-2. 인스턴스 내에서 실행할 명령들
# Docker registry 인증
gcloud auth configure-docker

# AI-LMS 컨테이너 실행
docker run -d \
  --name ai-lms \
  --restart unless-stopped \
  -p 80:80 \
  gcr.io/$PROJECT_ID/ai-lms:latest

# 컨테이너 상태 확인
docker ps
docker logs ai-lms
```

## 🔧 배포 스크립트

### 로컬 빌드 및 푸시 스크립트