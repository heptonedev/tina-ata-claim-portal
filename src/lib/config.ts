const DEV_API = "https://tina-galxe-api-dev-398996508761.asia-northeast3.run.app";
const PROD_API = "https://tina-galxe-api-prod-398996508761.asia-northeast3.run.app";

// 로컬 개발은 dev API, 운영 빌드는 prod API. VITE_API_BASE 로 덮어쓸 수 있다.
export const API_BASE: string = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? DEV_API : PROD_API);

export const GALXE_CLIENT_ID = "2129a0a0f3b7f593e9923cfd745dd665af85fb166b5a4cf93ebeda38ea58b84f";
export const GALXE_OAUTH_URL = "https://app.galxe.com/oauth";
export const GALXE_REDIRECT_URI = import.meta.env.DEV ? "http://localhost:5173/" : "https://tina-galxe.heptone.io/";
export const GALXE_SCOPES = "GalxeID SolanaAddress EVMAddress Email Twitter Discord Github Telegram";

export const TINA_MINT = "BJUP7hZoN8GFunH3ucrdBjuphyz2Ryg1R8pt3D4tm6wZ";
export const RPC_ENDPOINT = "https://solana-mainnet.g.allthatnode.com/full/json_rpc/a27dfe38723a4a2c9852ece82e92f2ed";
