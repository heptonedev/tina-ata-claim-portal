import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { TINA_MINT } from "@/lib/config";

const MINT = new PublicKey(TINA_MINT);
// TOKEN-2022 토큰 계정 보관료(약 0.00207 SOL) + 수수료 여유분
export const ATA_COST_SOL = 0.0021;

export type TokenAccountStatus = "unknown" | "checking" | "missing" | "creating" | "ready";

/** 연결한 지갑의 TINA 토큰 계정(ATA)을 확인하고, 없으면 지갑 주인이 비용을 내고 만든다. */
export function useTokenAccount() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<TokenAccountStatus>("unknown");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 토큰 계정이 있으면 true. */
  const check = useCallback(async (): Promise<boolean> => {
    if (!publicKey) {
      setStatus("unknown");
      setSolBalance(null);
      return false;
    }
    setStatus("checking");
    setError(null);
    try {
      const ata = getAssociatedTokenAddressSync(MINT, publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      // 공용 RPC 호출 제한 때문에 차례로 부른다
      const info = await connection.getAccountInfo(ata, "confirmed");
      if (info) {
        setStatus("ready");
        return true;
      }
      setSolBalance((await connection.getBalance(publicKey, "confirmed")) / LAMPORTS_PER_SOL);
      setStatus("missing");
    } catch {
      setStatus("missing");
      setError("Couldn't check your wallet. Try again.");
    }
    return false;
  }, [publicKey, connection]);

  useEffect(() => {
    void check();
  }, [check]);

  const create = useCallback(async () => {
    if (!publicKey) return;
    setStatus("creating");
    setError(null);
    try {
      const ata = getAssociatedTokenAddressSync(MINT, publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      const tx = new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(publicKey, ata, publicKey, MINT, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
      );
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      setStatus("ready");
    } catch (err) {
      // 확인만 늦었을 수 있으니 실제 상태를 다시 본다
      if (await check()) return;
      const cancelled = err instanceof Error && /reject|cancel|denied/i.test(err.message);
      setError(cancelled ? "You cancelled the transaction. Approve it to create your TINA account." : "Your TINA account wasn't created. Check your SOL balance and try again.");
    }
  }, [publicKey, connection, sendTransaction, check]);

  return { status, solBalance, error, create, recheck: check };
}
