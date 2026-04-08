@AGENTS.md

# TINA 에어드롭 프로젝트

## 프로젝트 개요
솔라나 TOKEN2022 기반 TINA 토큰 에어드롭 신청 웹페이지

## 기술 스택
- **프레임워크**: React 19 + Vite (SPA)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4
- **블록체인**: Solana (TOKEN2022 프로그램)
- **지갑 연결**: @solana/wallet-adapter-react

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
├── globals.css           # 글로벌 스타일 (다크 테마, 글래스모피즘)
├── components/
│   ├── AirdropCard.tsx   # 에어드롭 카드 (연결/ATA 생성/삭제/에어드롭 신청)
│   ├── Sidebar.tsx       # 사이드바 (Token-2022 정보, 잔액, ATA 주소)
│   └── Toast.tsx         # 토스트 알림 컴포넌트
├── hooks/
│   └── useTinaToken.ts   # TINA 토큰 커스텀 훅 (잔액 조회, ATA 관리)
└── utils/
    └── format.ts         # 잔액 포맷 유틸리티
```

## 명령어
- `npm run dev` — Vite 개발 서버 실행
- `npm run build` — tsc + Vite 프로덕션 빌드 (출력: dist/)
- `npm run preview` — 빌드 결과 프리뷰
- `npm run lint` — ESLint 실행
- `bash deploy-ec2.sh` — EC2 배포 (빌드 + SCP 업로드)

## AWS EC2 배포
- **스크립트**: `deploy-ec2.sh` (빌드 → dist/ 를 EC2로 SCP 전송)
- **SSH 키**: `$HOME/.ssh/heptone-dev.pem` (환경변수 `SSH_KEY`로 오버라이드 가능)
- **호스트**: `ec2-user@172.31.39.223`
- **원격 경로**: `/srv/tina-galxe-page`
- 배포 후 브라우저 강력 새로고침(Cmd+Shift+R) 필요

## 핵심 로직 흐름
1. 지갑 연결 → SOL 잔액 조회 + ATA 존재 확인
2. ATA 미존재 → ATA 생성 (SOL 수수료)
3. ATA 존재 → 에어드롭 신청 가능
4. ATA 삭제 → 잔액 0일 때만 가능, rent-exempt SOL 반환

## 주의사항
- 에어드롭 신청 로직은 placeholder (백엔드 연동 필요)
- 공용 Solana RPC는 403 차단되므로 별도 RPC 사용 필수
- Wallet Standard 자동 감지 사용 (수동 어댑터 등록 시 MetaMask 중복 키 경고 발생)
- `autoConnect` 활성화 상태, 연결 해제 시 localStorage 클리어 + 페이지 리로드로 처리
