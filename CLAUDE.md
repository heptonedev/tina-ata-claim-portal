@AGENTS.md

# TINA 에어드롭 프로젝트

## 프로젝트 개요
TINA × Galxe 에어드롭 신청 웹앱 (프론트엔드 + API 서버).
Galxe의 TINA 캠페인 두 곳 중 **한 곳이라도 포인트가 있는 Galxe 계정**만 신청할 수 있다.
신청은 명단(`event_claims`, `pending`)에만 쌓이고, 실제 토큰 지급은 이 앱 밖에서 별도로 한다.

## 기술 스택
### 프론트엔드
- **프레임워크**: React 19 + Vite (SPA)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4
- **블록체인**: Solana (TOKEN2022 프로그램)
- **지갑 연결**: @solana/wallet-adapter-react
- **디자인 시스템**: TINA 앱 Figma 컬러 시스템 (Primary: #007DFF 블루 계열)

### API 서버
- **프레임워크**: Express 5 + TypeScript
- **DB**: MySQL (GCP Cloud SQL)
- **배포**: GCP Cloud Run
- **보안**: 지갑 서명 검증 (tweetnacl + bs58)

## 주요 상수
- **TINA 토큰 주소**: `BJUP7hZoN8GFunH3ucrdBjuphyz2Ryg1R8pt3D4tm6wZ`
- **토큰 프로그램**: TOKEN_2022_PROGRAM_ID (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`)
- **RPC 엔드포인트**: AllThatNode (providers.tsx에서 설정)

## 프로젝트 구조
```
index.html                # Vite 엔트리 (글꼴: Bricolage Grotesque, Instrument Sans)
deploy-ec2.sh             # EC2 배포 스크립트
src/
├── main.tsx / providers.tsx     # React 루트, Solana Wallet Provider
├── App.tsx                      # 신청 화면 (3단계 경로)
├── globals.css                  # 디자인 토큰 (밤 지도 남색, TINA 블루)
├── components/
│   ├── RouteStop.tsx            # 경로의 단계 하나 (핀 + 경로선)
│   ├── AccountPanel.tsx         # Galxe 캠페인 목록·포인트 패널
│   ├── Topography.tsx           # 정적 등고선 배경
│   ├── GalxeMark.tsx            # TINA × Galxe 표기
│   └── Button.tsx / Note.tsx
├── hooks/
│   ├── useGalxeSession.ts       # Galxe 로그인 콜백 처리, 세션 보관(sessionStorage)
│   ├── useCampaigns.ts          # 로그인 전 캠페인 목록
│   └── useClaim.ts              # 지갑 서명 → 신청
└── lib/
    ├── config.ts                # API 주소, Galxe OAuth, 토큰 주소
    ├── api.ts                   # 서버 호출
    ├── claimMessage.ts          # 서명 메시지 (서버와 형식 일치 필수)
    └── galxeOAuth.ts            # Galxe 로그인 이동·콜백 검증

api-server/src/
├── index.ts                     # Express, CORS, 시작 시 SESSION_SECRET 확인
├── galxe.ts                     # Galxe OAuth·포인트 조회 (공개 GraphQL)
├── session.ts                   # 신청 세션 토큰 (HMAC 서명, 30분)
├── claim-signature.ts           # 지갑 서명 검증
└── routes/ auth.ts · claims.ts · airdrop.ts
```

## 명령어
### 프론트엔드
- `npm run dev` — Vite 개발 서버 실행 (포트 5173)
- `npm run build` — tsc + Vite 프로덕션 빌드 (출력: dist/)
- `npm run preview` — 빌드 결과 프리뷰
- `npm run lint` — ESLint 실행
- `bash deploy-ec2.sh` — EC2 배포 (빌드 + SCP 업로드)

### API 서버
- `cd api-server && npm run dev` — 로컬 개발 서버 (포트 8080)
- `cd api-server && npm run build` — TypeScript 빌드
- `cd api-server && bash deploy-cloudrun.sh dev` — Cloud Run dev 배포
- `cd api-server && bash deploy-cloudrun.sh prod` — Cloud Run prod 배포

### 커스텀 스킬 (Claude Code)
- `/deploy-front` — 프론트엔드 EC2 배포
- `/deploy-api-dev` — API 서버 Cloud Run dev 배포
- `/deploy-api-prod` — API 서버 Cloud Run prod 배포
- `/kevin-help` — 커스텀 스킬 목록

## 배포 환경
### 프론트엔드 (AWS EC2)
- **스크립트**: `deploy-ec2.sh` (빌드 → dist/ 를 EC2로 SCP 전송)
- **SSH 키**: `$HOME/.ssh/heptone-dev.pem` (환경변수 `SSH_KEY`로 오버라이드 가능)
- **호스트**: `ec2-user@172.31.39.223`
- **원격 경로**: `/srv/tina-galxe-page`
- **포트**: 3003 (serve로 정적 파일 서빙)
- **systemd 서비스**: `tina-galxe`
- 배포 후 브라우저 강력 새로고침(Cmd+Shift+R) 필요

### API 서버 (GCP Cloud Run)
- **GCP 프로젝트**: `sound-jigsaw-459108-s9`
- **리전**: `asia-northeast3` (서울)
- **서비스명**: `tina-galxe-api-dev` / `tina-galxe-api-prod`
- **dev URL**: `https://tina-galxe-api-dev-398996508761.asia-northeast3.run.app`
- **prod URL**: `https://tina-galxe-api-prod-398996508761.asia-northeast3.run.app`
- **DB**: Cloud SQL (tina-db-dev / tina-db-prod)
- **DB 스키마**: `tina_events`
- **VPC**: `tina-vpc` (Cloud SQL 프라이빗 IP 접속)
- **환경변수**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `NODE_ENV`
- 배포 시 `--update-env-vars` 사용 (기존 환경변수 보존)

## API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/auth/galxe/campaigns` | 대상 캠페인 이름·Galxe 링크 (10분 캐시) |
| `POST` | `/api/auth/galxe/session` | Galxe 로그인 code → 포인트 확인 → 신청 세션 발급 |
| `POST` | `/api/claims` | 세션 + 지갑 서명으로 신청 |
| `GET` | `/api/airdrop/status/:wallet` | 신청 상태 조회 |
| `GET` | `/health` | 헬스체크 |

2026-10-19 제거: `POST /api/airdrop/claim`(Galxe 없이 신청, 수량을 신청자가 지정),
`POST /api/auth/galxe/verify`(로그인과 신청을 한 번에 처리하던 이전 방식).

## 핵심 로직 흐름
1. **Galxe 로그인** → 서버가 code로 Galxe 사용자(GalxeID, 연결된 EVM·Solana 주소)를 조회
2. 연결 주소마다 `GALXE_CAMPAIGN_IDS`의 각 캠페인에서 받은 포인트(`claimedLoyaltyPoints`)를 조회.
   **한 캠페인이라도 포인트가 있으면 대상자 (OR)**. 서버가 30분짜리 세션 토큰을 발급
   - 포인트는 Galxe ID가 아니라 **Galxe에 연결된 지갑 주소** 기준으로 쌓인다
3. **Solana 지갑 연결** — 받을 지갑. Galxe 퀘스트에 쓴 주소와 달라도 된다
4. **서명 후 신청** — 메시지 `TINA Airdrop Claim` / `Wallet: <주소>` / `Nonce: <세션 sid>` / `Issued At: <ISO>`.
   서버가 세션·서명(10분 유효)·중복을 확인하고 `pending`으로 저장 (`token_amount`는 0)

토큰 계정(ATA)은 사용자에게 만들게 하지 않는다. 신청을 쉽게 하려고 지급할 때 만들어 준다
(대상자 1명당 약 0.002 SOL을 지급하는 쪽이 부담).

## 보안
- **신청 경로는 `/api/claims` 하나**이며 Galxe 세션 + 지갑 서명이 모두 있어야 한다
- **세션 토큰**: 서버가 HMAC으로 서명해 브라우저가 대상자 여부·Galxe ID를 바꿀 수 없다. 응답 로그에서는 가린다
- **서명 재사용 방지**: 서명 메시지의 Nonce가 세션 sid와 같아야 해서 다른 로그인의 서명은 쓸 수 없다
- **중복 방지**: 지갑당 1회 `(event_name, wallet_address)`, Galxe 계정당 1회 `(event_name, galxe_id)` UNIQUE.
  `uq_event_galxe`는 `api-server/migrations/20261019_unique_galxe_id.sql`로 dev·prod DB에 적용해야 한다
- **지급 수량은 신청자가 정하지 않는다** (`token_amount` 0, 지급 기준이 정해지면 서버에서 채운다)
- **CORS**는 브라우저만 막는다. 보안은 위 서버 검증에 의존한다
- Galxe 사용자 정보(이메일·SNS)는 저장하지 않는다

### 대상 캠페인 (2026-10-19 마케팅팀 확인)
| 캠페인 ID | 이름 | 포인트 |
|-----------|------|--------|
| `GCTRHtYPu2` | Join the TINA Genesis | 60 |
| `GCUoHtYCUo` | TINA 101: Fun Quiz & Easy Rewards | 40 |

- 스페이스: TINA (ID `85280`, alias `JBvKEutjhxpReU6fy84MqE`). 스페이스 캠페인 14개 중 포인트를 주는 건 이 둘뿐이라
  "Loyalty Points 보유자" = 두 캠페인 중 하나라도 포인트가 있는 사람
- 두 캠페인 모두 **종료**됐다. 대상자는 확정 상태이고 새로 포인트를 얻을 방법이 없다
- 포인트 조회(`claimedLoyaltyPoints`)는 공개 엔드포인트에서 **access-token 없이** 실제 값이 나온다 (2026-10-19 검증).
  Galxe 대시보드에서 발급한 Server API 토큰은 유효하지만 이 기능에는 쓰지 않는다

### 환경변수 (API 서버)
| 이름 | 필수 | 설명 |
|------|------|------|
| `GALXE_CAMPAIGN_IDS` | ✅ | `GCTRHtYPu2,GCUoHtYCUo`. 비어 있으면 로그인 시 "not open yet" |
| `SESSION_SECRET` | ✅ | 32자 이상, 모든 인스턴스 동일. 없으면 dev·prod에서 서버가 뜨지 않는다 (`openssl rand -hex 32`) |
| `GALXE_CLIENT_SECRET` | ✅ | Galxe OAuth. **2026-10-19 기준 prod Cloud Run에 없음** |
| `GALXE_ACCESS_TOKEN` | | 지금은 불필요. Galxe가 공개 조회를 막으면 설정 (값은 Cloud Run 에만, 리포·채팅 금지) |
| `DB_*` | ✅ | Cloud SQL `tina_events` |

### 운영 데이터 주의
`event_claims`에는 옛 경로로 들어온 **부정 신청**이 dev·prod 모두 섞여 있다(2026-10-18 공격, 1,000,000 TINA 등).
`galxe_id`가 NULL인 행이 그것이다. 이 명단으로 지급하기 전에 반드시 정리해야 한다.

## 주의사항
- 공용 Solana RPC는 403 차단되므로 별도 RPC 사용 필수
- Wallet Standard 자동 감지 사용 (수동 어댑터 등록 시 MetaMask 중복 키 경고 발생)
- `autoConnect` 활성화 상태, 연결 해제 시 localStorage 클리어 + 페이지 리로드로 처리
- Vite에서 Solana 라이브러리 사용 시 Buffer polyfill 필요 (polyfills.ts)
- `.env` 파일의 DB 비밀번호에 특수문자 포함 시 작은따옴표로 감싸야 함
- 프론트 API 주소는 `src/lib/config.ts`: 로컬 개발은 dev API, 운영 빌드는 prod API (`VITE_API_BASE`로 덮어쓰기)
- `npm run lint`는 Next.js 시절 설정(`eslint-config-next`)이 남아 있어 현재 실행되지 않는다
