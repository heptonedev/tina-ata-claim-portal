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
│   ├── useEventInfo.ts          # 로그인 전 캠페인 목록·신청 마감 시각
│   ├── useTokenAccount.ts       # TINA 토큰 계정(ATA) 확인·생성 (신청자 부담)
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
├── token-account.ts             # 신청 지갑의 TINA ATA 온체인 확인
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
| `GET` | `/api/auth/galxe/campaigns` | 대상 캠페인 이름·Galxe 링크 (10분 캐시), 신청 마감 `closesAt` |
| `POST` | `/api/auth/galxe/session` | Galxe 로그인 code → 포인트 확인 → 신청 세션 발급 |
| `POST` | `/api/auth/gacha/session` | 홈페이지 가챠 로그인 토큰 → 가챠 백엔드 `/me`로 Lucky Points 확인 → 신청 세션 발급 |
| `POST` | `/api/claims` | 세션(Galxe·가챠) + 지갑 서명으로 신청 |
| `GET` | `/api/airdrop/status/:wallet` | 신청 상태 조회 |
| `GET` | `/health` | 헬스체크 |

2026-10-19 제거: `POST /api/airdrop/claim`(Galxe 없이 신청, 수량을 신청자가 지정),
`POST /api/auth/galxe/verify`(로그인과 신청을 한 번에 처리하던 이전 방식).

## 핵심 로직 흐름
1. **Galxe 로그인** — 데스크톱은 **팝업**, 모바일·지갑 앱 브라우저·팝업 차단 시에는 **페이지 이동**.
   팝업 여부는 state 접두어 `popup-`로 구분한다(Chrome은 다른 사이트로 이동하면 `window.name`을 지운다).
   팝업이 우리 도메인으로 돌아오면 `main.tsx`의 `handlePopupCallback`이 `window.opener.postMessage`와
   `BroadcastChannel` 두 경로로 결과를 넘기고 창을 닫는다. 원래 창이 state를 확인한 뒤 서버를 호출한다.
   Galxe는 iframe을 막아서(`frame-ancestors 'none'`) 팝업이 아니면 페이지 이동뿐이다. 
   → 서버가 code로 Galxe 사용자(GalxeID, 연결된 EVM·Solana 주소)를 조회
2. 연결 주소마다 `GALXE_CAMPAIGN_IDS`의 각 캠페인에서 받은 포인트(`claimedLoyaltyPoints`)를 조회.
   **한 캠페인이라도 포인트가 있으면 대상자 (OR)**. 서버가 30분짜리 세션 토큰을 발급
   - 포인트는 Galxe ID가 아니라 **Galxe에 연결된 지갑 주소** 기준으로 쌓인다
3. **Solana 지갑 연결** — 받을 지갑. Galxe 퀘스트에 쓴 주소와 달라도 된다
4. **TINA 토큰 계정(ATA) 만들기** — 신청자가 직접 만들고 보관료(약 0.0021 SOL)도 신청자가 낸다
   (`useTokenAccount`, idempotent 생성). 이미 있으면 바로 다음 단계로 넘어간다
5. **서명 후 신청** — 메시지 `TINA Airdrop Claim` / `Wallet: <주소>` / `Nonce: <세션 sid>` / `Issued At: <ISO>`.
   서버가 마감(`CLAIMS_CLOSE_AT`)·세션·서명(10분 유효)·**온체인 ATA 존재**·중복을 확인하고
   `pending`으로 저장 (`token_amount`는 0)

ATA 비용은 신청자 부담이다 (2026-10-19 결정). 2026-10-19 이전 화면은 지급 때 만들어 주는 방식이었다.

### 가챠 이벤트 신청 (2026-10-20 추가)
홈페이지(`/Users/kevin/workspace/tina-homepage`, `/gacha` 페이지의 `GachaAirdrop` 섹션)에서 받는 신청도 이 서버가 받는다.
Galxe 로그인은 쓰지 않는다.
1. 홈페이지 가챠 로그인(지갑 서명 → 가챠 JWT)을 그대로 쓴다
2. `POST /api/auth/gacha/session` — 서버가 가챠 JWT로 `https://tina-gacha-api.tina.im/api/wallets/v1/me`를 불러
   지갑 주소·`totalPoints`(Lucky Points)를 받는다. 가챠 백엔드가 JWT를 검증하므로 그 주소가 곧 가챠 지갑이다.
   가챠 JWT는 저장하지 않는다
3. ATA 만들기 → 서명 후 `/api/claims` (Galxe와 같은 경로·같은 서명 형식). TINA는 가챠 지갑으로 받는다

| 구분 | Galxe | 가챠 |
|------|-------|------|
| `event_name` | `galxe_airdrop` | `gacha_airdrop` |
| 계정당 1회 기준 | `galxe_id` | `gacha_address` |
| `points` | 두 캠페인 포인트 합계 | Lucky Points |

- **`token_amount = points × 1 TINA`** (2026-10-20 마케팅 확정, `event.ts`의 `TINA_PER_POINT`). 지급 전에 마감 시점 포인트로 다시 확인한다
- 같은 사람이 Galxe·가챠 두 이벤트에 각각 신청할 수 있다 (이벤트별로 지갑·계정당 1회)
- `gacha_address`·`points` 컬럼은 `migrations/20261020_gacha_claims.sql`. **새 서버 코드는 이 컬럼에 값을 넣으므로
  마이그레이션 없이 배포하면 Galxe 신청까지 실패한다.** dev·prod 모두 마이그레이션 → 배포 순서를 지킨다

### 테스트 초기화 (개발 사이트 전용)
devnet 빌드 화면(로컬·`tina-galxe-dev.web.app`·`tinaim.web.app`)에 "Reset for testing" 카드가 나온다(지갑 연결 시).
버튼 하나로 ① 지금 로그인한 계정의 신청 기록 삭제(dev API `/api/test/reset-claim`, `pending`·미지급 건만)
② 연결 지갑의 devnet TINA 계정 삭제(남은 devnet TINA는 devnet System 지갑 `CgpbS1…SurN`으로 반환 후 CloseAccount)를 한다.
운영(mainnet) 빌드에는 카드가 없고, prod API에는 경로가 없다(404).

### 네트워크 (개발은 devnet)
테스트에 실제 SOL이 들지 않도록 개발 환경은 devnet TINA(`4vwPq1eehywTuLFPqo7muAYAbF9cjjqVhv2h4EFqc1M5`)로 ATA를 확인·생성한다.
지급은 운영(mainnet)만 해당한다.
- API: `SOLANA_RPC_URL`·`SOLANA_TINA_MINT` 환경변수 (없으면 mainnet). dev Cloud Run에만 devnet 값을 넣는다
- 이 프론트: `config.ts`의 `SOLANA_NETWORK` — dev API를 부르게 빌드하면 devnet, 아니면 mainnet
- 홈페이지: 빌드의 `NEXT_PUBLIC_SOLANA_NETWORK` (Firebase 개발 배포는 devnet, 운영은 mainnet)

## 보안
- **신청 경로는 `/api/claims` 하나**이며 Galxe 세션 + 지갑 서명이 모두 있어야 한다
- **세션 토큰**: 서버가 HMAC으로 서명해 브라우저가 대상자 여부·Galxe ID를 바꿀 수 없다. 응답 로그에서는 가린다
- **서명 재사용 방지**: 서명 메시지의 Nonce가 세션 sid와 같아야 해서 다른 로그인의 서명은 쓸 수 없다
- **중복 방지**: 지갑당 1회 `(event_name, wallet_address)`, Galxe 계정당 1회 `(event_name, galxe_id)` UNIQUE.
  `uq_event_galxe`는 `api-server/migrations/20261019_unique_galxe_id.sql`로 dev·prod DB에 적용해야 한다
- **지급 수량은 신청자가 정하지 않는다** (`token_amount` 0, 지급 기준이 정해지면 서버에서 채운다)
- **CORS**는 브라우저만 막는다. 보안은 위 서버 검증에 의존한다
- Galxe 사용자 정보(이메일·SNS)는 저장하지 않는다

### API 배포 (로컬 Docker 없이)
`deploy-cloudrun.sh`는 로컬 Docker가 필요하다. Docker 없이 배포할 때는 이미지만 Cloud Build로 만들고
배포는 `gcloud run deploy --update-env-vars`로 한다. 기본 Cloud Build 서비스 계정은 소스 버킷 권한이 없어
실패하므로 기존 트리거와 같은 `tina-app` 서비스 계정을 지정한다.

```bash
cd api-server
gcloud builds submit --region=asia-northeast3 --project=sound-jigsaw-459108-s9 \
  --service-account=projects/sound-jigsaw-459108-s9/serviceAccounts/tina-app@sound-jigsaw-459108-s9.iam.gserviceaccount.com \
  --config=<docker build + images 만 있는 설정, options.logging: CLOUD_LOGGING_ONLY> .
gcloud run deploy tina-galxe-api-<env> --image <이미지@digest> --region=asia-northeast3 \
  --project=sound-jigsaw-459108-s9 --update-env-vars NODE_ENV=<env>
```

- ⚠️ **`--set-env-vars`를 쓰지 말 것.** DB 접속정보·시크릿을 포함한 기존 환경변수를 모두 지운다.
  `cloudbuild.yaml`이 예전에 이 옵션을 썼다(2026-10-19 `--update-env-vars`로 수정)
- `.gcloudignore`가 `.env`(DB 비밀번호)와 `node_modules`를 업로드에서 뺀다
- 쉼표가 들어간 값은 구분자를 바꿔서 넣는다: `"--update-env-vars=^@^GALXE_CAMPAIGN_IDS=A,B@SESSION_SECRET=..."`

| 환경 | 2026-10-19 상태 |
|------|----------------|
| dev | 가챠 신청·devnet 적용 (리비전 00019). 캠페인 ID·SESSION_SECRET·`CLAIMS_CLOSE_AT=2026-10-31T23:59:59+09:00`·`SOLANA_RPC_URL`(devnet)·`SOLANA_TINA_MINT`(devnet) 설정, `uq_event_galxe`·`20261020_gacha_claims` 적용 |
| prod | **옛 코드 그대로** (옛 신청 경로 열려 있음), `GALXE_CLIENT_SECRET`·`SESSION_SECRET`·`CLAIMS_CLOSE_AT` 없음, 마이그레이션 둘 다 미적용 (`uq_event_galxe`, `20261020_gacha_claims`) |
| 프론트 (`tina-galxe.heptone.io`) | 2026-10-19 새 화면 배포. **dev API를 부르도록 빌드**했다(운영 API가 옛 코드라서). 그래서 지금은 **devnet**으로 동작한다(2026-10-20). 운영 API를 올린 뒤에는 `VITE_API_BASE` 없이 다시 빌드해 배포한다 |

### 프론트 사이트 (2026-10-20 개발 사이트 분리)
| 사이트 | 용도 | API·네트워크 | 배포 |
|--------|------|-------------|------|
| `https://tina-galxe-dev.web.app` | 개발 | dev API · devnet | `npm run deploy:dev` (Firebase `tina-airdrop-event` 프로젝트, 사이트 `tina-galxe-dev`) |
| `https://tina-galxe.heptone.io` | 운영 | 운영 API · mainnet (예정) | `deploy-ec2.sh` (EC2). **운영 API가 준비될 때까지는 dev API·devnet으로 빌드된 상태** |

Galxe 로그인 후 돌아오는 주소(`GALXE_REDIRECT_URI`)는 **지금 열린 사이트 주소**(`window.location.origin + "/"`)다.
그래서 각 사이트 주소가 Galxe OAuth 앱에 redirect URI로 등록돼 있어야 한다.
2026-10-20 기준 등록된 것은 `https://tina-galxe.heptone.io/`뿐이다. `https://tina-galxe-dev.web.app/`, `http://localhost:5173/`은
Galxe에 추가를 요청해야 한다(Authorize HTTP 438 문의와 함께).

프론트 배포·되돌리기:
```bash
# dev API를 부르도록 빌드해서 배포 (deploy-ec2.sh 와 같은 과정)
VITE_API_BASE=https://tina-galxe-api-dev-398996508761.asia-northeast3.run.app bash deploy-ec2.sh
# 직전 버전으로 되돌리기 (서버에 백업해 둠, VPN 필요). 백업: .bak-20261019(새 화면 이전), .bak-20261019-popup(팝업 이전), .bak-20261019-ata(ATA 단계 이전), .bak-20261019-deadline(마감일 표시 이전), .bak-20261020-devnet(devnet 전환 이전)
ssh -i ~/.ssh/heptone-dev.pem ec2-user@172.31.39.223 \
  "rm -rf /srv/tina-galxe-page && cp -a /srv/tina-galxe-page.bak-20261019 /srv/tina-galxe-page && sudo systemctl restart tina-galxe"
```

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
| `CLAIMS_CLOSE_AT` | | 신청 마감 ISO 시각. **확정: `2026-10-31T23:59:59+09:00`** (10/31 23:59 KST, 2026-10-19 결정). 이후 `/api/claims`는 403. 없으면 마감 없음 |
| `SOLANA_RPC_URL` | | 신청 지갑의 ATA 확인용 RPC. 없으면 mainnet AllThatNode. **dev는 devnet RPC** |
| `SOLANA_TINA_MINT` | | ATA 확인용 TINA 민트. 없으면 mainnet 민트. **dev는 devnet 민트** `4vwPq…c1M5` |
| `ALLOW_TEST_RESET` | | `true`면(그리고 `NODE_ENV=dev`일 때만) `POST /api/test/reset-claim` 연결. 로그인한 계정의 미지급 신청을 지운다. **dev에만 설정, prod 금지** |
| `GACHA_API_URL` | | 가챠 백엔드. 없으면 `https://tina-gacha-api.tina.im` |
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
