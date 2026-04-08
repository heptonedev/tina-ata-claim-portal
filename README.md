# TINA Airdrop

Solana TOKEN2022 기반 TINA 토큰 에어드롭 신청 웹앱

## 구성

| 구분 | 기술 스택 | 배포 |
|------|----------|------|
| **프론트엔드** | React 19 + Vite + Tailwind CSS v4 | AWS EC2 (포트 3003) |
| **API 서버** | Express 5 + TypeScript + MySQL | GCP Cloud Run |

## 주요 기능

- Solana 지갑 연결 (Phantom, Solflare)
- Associated Token Account (ATA) 생성/삭제
- 에어드롭 신청 (지갑 서명 검증)
- 신청 상태 조회
- 지도 배경 애니메이션 (POI 시각화)

## 시작하기

### 프론트엔드

```bash
npm install
npm run dev          # http://localhost:5173
```

### API 서버

```bash
cd api-server
npm install
cp .env.example .env # DB 접속 정보 입력
npm run dev          # http://localhost:8080
```

## 배포

```bash
# 프론트엔드 → EC2
bash deploy-ec2.sh

# API 서버 → Cloud Run
cd api-server
bash deploy-cloudrun.sh dev    # dev 환경
bash deploy-cloudrun.sh prod   # prod 환경
```

## API

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/airdrop/claim` | 에어드롭 신청 (지갑 서명 필요) |
| `GET` | `/api/airdrop/status/:wallet` | 신청 상태 조회 |
| `GET` | `/health` | 헬스체크 |

## DB 스키마

```sql
CREATE DATABASE tina_events DEFAULT CHARSET=utf8mb4;

-- api-server/schema.sql 참고
```

## 보안

- 에어드롭 신청 시 지갑 메시지 서명 → 백엔드에서 tweetnacl로 검증
- 본인 지갑만 신청 가능 (타인 지갑 주소로 대리 신청 불가)
- CORS 제한 (허용된 도메인만 API 접근 가능)
