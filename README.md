# TINA Airdrop

TINA × Galxe 에어드롭 신청 웹앱. Galxe의 TINA 캠페인 중 한 곳이라도 포인트가 있으면 신청할 수 있다.

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

### API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/auth/galxe/campaigns` | 대상 Galxe 캠페인 목록 |
| `POST` | `/api/auth/galxe/session` | Galxe 로그인 → 포인트 확인 → 신청 세션 |
| `POST` | `/api/claims` | 세션 + 지갑 서명으로 신청 |
| `GET` | `/api/airdrop/status/:wallet` | 신청 상태 조회 |
| `GET` | `/health` | 헬스체크 |

## DB 스키마

```sql
CREATE DATABASE tina_events DEFAULT CHARSET=utf8mb4;

-- api-server/schema.sql 참고
```

## 보안

- Galxe 로그인 + 지갑 메시지 서명 → 백엔드에서 tweetnacl로 검증
- 본인 지갑만 신청 가능 (타인 지갑 주소로 대리 신청 불가)
- 지갑당 1회, Galxe 계정당 1회
- CORS 제한 (허용된 도메인만 API 접근 가능)
