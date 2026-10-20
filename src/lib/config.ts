const DEV_API = "https://tina-galxe-api-dev-398996508761.asia-northeast3.run.app";
const PROD_API = "https://tina-galxe-api-prod-398996508761.asia-northeast3.run.app";

// 로컬 개발은 dev API, 운영 빌드는 prod API. VITE_API_BASE 로 덮어쓸 수 있다.
export const API_BASE: string = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? DEV_API : PROD_API);

export const GALXE_CLIENT_ID = "2129a0a0f3b7f593e9923cfd745dd665af85fb166b5a4cf93ebeda38ea58b84f";
export const GALXE_OAUTH_URL = "https://app.galxe.com/oauth";
// Galxe 로그인 후 돌아올 주소는 지금 열린 사이트다 (로컬, Firebase 개발 사이트, 운영 EC2).
// 각 주소가 Galxe OAuth 앱에 redirect URI 로 등록돼 있어야 한다.
export const GALXE_REDIRECT_URI = `${window.location.origin}/`;
export const GALXE_SCOPES = "GalxeID SolanaAddress EVMAddress Email Twitter Discord Github Telegram";

// dev API 는 devnet 에서 ATA 를 확인한다 (테스트에 실제 SOL 이 들지 않게). 프론트도 API 에 맞춘다.
export const SOLANA_NETWORK: "mainnet" | "devnet" = API_BASE === DEV_API ? "devnet" : "mainnet";

export const TINA_MINT =
  SOLANA_NETWORK === "devnet" ? "4vwPq1eehywTuLFPqo7muAYAbF9cjjqVhv2h4EFqc1M5" : "BJUP7hZoN8GFunH3ucrdBjuphyz2Ryg1R8pt3D4tm6wZ";
export const RPC_ENDPOINT =
  SOLANA_NETWORK === "devnet"
    ? "https://solana-devnet.g.allthatnode.com/full/json_rpc/a27dfe38723a4a2c9852ece82e92f2ed"
    : "https://solana-mainnet.g.allthatnode.com/full/json_rpc/a27dfe38723a4a2c9852ece82e92f2ed";
