// 신청 지갑에 TINA 토큰 계정(ATA)이 있는지 온체인에서 확인한다.
// ATA 는 신청자가 직접 만들고 비용(SOL)도 낸다. 지급할 때 저희가 만들어 주지 않는다.
// 지급은 ATA 로 보내므로, 같은 민트의 다른 토큰 계정이 아니라 정확한 ATA 주소의 계정을 확인한다.

import { Connection, PublicKey, type ParsedAccountData } from "@solana/web3.js";

const TINA_MINT = new PublicKey(process.env.SOLANA_TINA_MINT || "BJUP7hZoN8GFunH3ucrdBjuphyz2Ryg1R8pt3D4tm6wZ");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RPC_URL = process.env.SOLANA_RPC_URL || "https://solana-mainnet.g.allthatnode.com/full/json_rpc/a27dfe38723a4a2c9852ece82e92f2ed";
const REQUEST_TIMEOUT_MS = 8000;

const connection = new Connection(RPC_URL, {
  commitment: "confirmed",
  fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }),
});

export class RpcUnavailableError extends Error {}

/** 지갑의 TINA ATA 주소 (Token-2022). */
export function tinaTokenAccountAddress(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), TINA_MINT.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

/** 지갑의 TINA ATA 가 있고, 민트·소유자가 맞고, 사용 가능한(동결되지 않은) 상태면 true. */
export async function hasTinaTokenAccount(wallet: string): Promise<boolean> {
  let owner: PublicKey;
  try {
    owner = new PublicKey(wallet);
  } catch {
    return false;
  }

  let account: Awaited<ReturnType<Connection["getParsedAccountInfo"]>>["value"];
  try {
    ({ value: account } = await connection.getParsedAccountInfo(tinaTokenAccountAddress(owner)));
  } catch (err) {
    throw new RpcUnavailableError(`Solana RPC request failed: ${(err as Error).message}`);
  }
  if (!account || !account.owner.equals(TOKEN_2022_PROGRAM_ID)) return false;

  const data = account.data as ParsedAccountData | Buffer;
  if (Buffer.isBuffer(data) || data.parsed?.type !== "account") return false;
  const info = data.parsed.info as { mint?: string; owner?: string; state?: string };
  return info.mint === TINA_MINT.toBase58() && info.owner === owner.toBase58() && info.state === "initialized";
}
