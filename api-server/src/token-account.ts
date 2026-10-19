// 신청 지갑에 TINA 토큰 계정(ATA)이 있는지 온체인에서 확인한다.
// ATA 는 신청자가 직접 만들고 비용(SOL)도 낸다. 지급할 때 저희가 만들어 주지 않는다.

const TINA_MINT = process.env.SOLANA_TINA_MINT || "BJUP7hZoN8GFunH3ucrdBjuphyz2Ryg1R8pt3D4tm6wZ";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const RPC_URL = process.env.SOLANA_RPC_URL || "https://solana-mainnet.g.allthatnode.com/full/json_rpc/a27dfe38723a4a2c9852ece82e92f2ed";
const REQUEST_TIMEOUT_MS = 8000;

export class RpcUnavailableError extends Error {}

/** 지갑이 TINA(TOKEN-2022) 토큰 계정을 하나라도 가지고 있으면 true. */
export async function hasTinaTokenAccount(wallet: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [wallet, { mint: TINA_MINT }, { encoding: "base64", commitment: "confirmed" }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new RpcUnavailableError(`Solana RPC request failed: ${(err as Error).message}`);
  }
  if (!res.ok) throw new RpcUnavailableError(`Solana RPC HTTP ${res.status}`);

  const body = await res.json();
  if (body.error) throw new RpcUnavailableError(`Solana RPC error: ${JSON.stringify(body.error).slice(0, 300)}`);

  const accounts: { account?: { owner?: string } }[] = body.result?.value ?? [];
  return accounts.some((a) => a.account?.owner === TOKEN_2022_PROGRAM_ID);
}
