#!/usr/bin/env bash
set -e

SSH_KEY="${SSH_KEY:-$HOME/.ssh/heptone-dev.pem}"
EC2_HOST="ec2-user@172.31.39.223"
REMOTE_DIR="/srv/tina-galxe-page"
SSH_CMD="/usr/bin/ssh -i $SSH_KEY"

echo "=== 1. 빌드 ==="
npm run build

echo ""
echo "=== 2. EC2로 업로드 (덮어쓰기) ==="
scp -i "$SSH_KEY" -r dist/* "$EC2_HOST:$REMOTE_DIR/"

echo ""
echo "=== 3. 서비스 재시작 ==="
$SSH_CMD "$EC2_HOST" "sudo systemctl restart tina-galxe"

echo ""
echo "=== 완료 ==="
echo "포트 3003 에서 서빙 중입니다."
echo "브라우저에서 강력 새로고침(Cmd+Shift+R) 해주세요."
