@AGENTS.md

# TINA 에어드롭 프로젝트

## 프로젝트 개요
솔라나 TOKEN2022 기반 TINA 토큰 에어드롭 신청 웹앱 (프론트엔드 + API 서버)

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
index.html                # Vite 엔트리 포인트
vite.config.ts            # Vite 설정 (React 플러그인, @ alias)
deploy-ec2.sh             # EC2 배포 스크립트
src/
├── main.tsx              # React 루트 렌더링 + Providers 래핑
├── App.tsx               # 메인 에어드롭 페이지
├── providers.tsx         # Solana Wallet Provider 설정
├── globals.css           # 글로벌 스타일 (다크 테마, Figma 디자인 시스템)
├── polyfills.ts          # Buffer polyfill (Solana 라이브러리용)
├── components/
│   ├── AirdropCard.tsx   # 에어드롭 카드 (연결/ATA 생성/삭제/에어드롭 신청)
│   ├── Sidebar.tsx       # 사이드바 (Token-2022 정보, 잔액, ATA 주소)
│   ├── MapBackground.tsx # 지도 배경 애니메이션 (Canvas, POI 마커)
│   └── Toast.tsx         # 토스트 알림 컴포넌트
├── hooks/
│   └── useTinaToken.ts   # TINA 토큰 커스텀 훅 (잔액 조회, ATA 관리, 에어드롭 신청)
└── utils/
    └── format.ts         # 잔액 포맷 유틸리티

api-server/               # API 서버 (Express + TypeScript)
├── Dockerfile            # Cloud Run 배포용
├── cloudbuild.yaml       # Cloud Build 설정
├── deploy-cloudrun.sh    # Cloud Run 배포 스크립트
├── schema.sql            # DB 스키마 (tina_events.event_claims)
├── .env                  # 로컬 DB 접속 정보 (gitignore)
└── src/
    ├── index.ts          # Express 앱 (CORS, 포트 8080)
    ├── db.ts             # MySQL 커넥션 풀
    └── routes/
        └── airdrop.ts    # 에어드롭 API (서명 검증 포함)
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
| `POST` | `/api/airdrop/claim` | 에어드롭 신청 (지갑 서명 검증) |
| `GET` | `/api/airdrop/status/:wallet` | 신청 상태 조회 |
| `GET` | `/health` | 헬스체크 |

## 핵심 로직 흐름
1. 지갑 연결 → SOL 잔액 조회 + ATA 존재 확인
2. ATA 미존재 → ATA 생성 (SOL 수수료)
3. ATA 존재 → 에어드롭 신청 가능
4. Claim 클릭 → 지갑에서 메시지 서명 (수수료 없음) → API에 서명 전송
5. 백엔드에서 서명 검증 → DB에 신청 기록 저장
6. ATA 삭제 → 잔액 0일 때만 가능, rent-exempt SOL 반환

## 보안
- **지갑 서명 검증**: 에어드롭 신청 시 지갑으로 메시지 서명 → 백엔드에서 tweetnacl로 검증
- **CORS**: 프론트엔드 도메인만 허용 (tina-galxe.heptone.io, localhost:5173)
- **중복 방지**: (event_name, wallet_address) UNIQUE 제약

## 주의사항
- 공용 Solana RPC는 403 차단되므로 별도 RPC 사용 필수
- Wallet Standard 자동 감지 사용 (수동 어댑터 등록 시 MetaMask 중복 키 경고 발생)
- `autoConnect` 활성화 상태, 연결 해제 시 localStorage 클리어 + 페이지 리로드로 처리
- Vite에서 Solana 라이브러리 사용 시 Buffer polyfill 필요 (polyfills.ts)
- `.env` 파일의 DB 비밀번호에 특수문자 포함 시 작은따옴표로 감싸야 함
