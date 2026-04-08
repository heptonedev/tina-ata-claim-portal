#!/usr/bin/env bash
set -e

ENVIRONMENT="${1:-dev}"
PROJECT_ID="sound-jigsaw-459108-s9"
REGION="asia-northeast3"
SERVICE_NAME="tina-galxe-api-${ENVIRONMENT}"
IMAGE="asia-northeast3-docker.pkg.dev/${PROJECT_ID}/tina-app-images/${SERVICE_NAME}"

echo "=== 1. Docker 이미지 빌드 (linux/amd64) ==="
docker build --platform linux/amd64 -t "$IMAGE" .

echo ""
echo "=== 2. Artifact Registry에 푸시 ==="
docker push "$IMAGE"

echo ""
echo "=== 3. Cloud Run 배포 (${SERVICE_NAME}) ==="
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --update-env-vars "NODE_ENV=${ENVIRONMENT}"

echo ""
echo "=== 완료 ==="
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format="value(status.url)"
