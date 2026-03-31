@AGENTS.md

# TINA 에어드롭 프로젝트

## 프로젝트 개요
솔라나 TOKEN2022 기반 TINA 토큰 에어드롭 신청 웹페이지

## 기술 스택
- **프레임워크**: Next.js 16 (App Router, Turbopack)
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
src/
├── app/
│   ├── layout.tsx        # 루트 레이아웃 + Providers 래핑
│   ├── page.tsx          # 메인 에어드롭 페이지
│   ├── providers.tsx     # Solana Wallet Provider 설정
│   └── globals.css       # 글로벌 스타일 (다크 테마, 글래스모피즘)
├── components/
│   ├── AirdropCard.tsx   # 에어드롭 카드 (연결/ATA 생성/삭제/에어드롭 신청)
│   └── WalletInfo.tsx    # 지갑 정보 (SOL 잔액, TINA 잔액, ATA 상태)
└── hooks/
    └── useTinaToken.ts   # TINA 토큰 커스텀 훅 (잔액 조회, ATA 관리)
```

## 명령어
- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 실행

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
