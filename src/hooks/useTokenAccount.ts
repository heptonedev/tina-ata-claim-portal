import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * 연결한 지갑의 TINA 토큰 계정(ATA)을 확인하고, 없으면 지갑 주인이 비용을 내고 만든다.
 * closesAt 이 지나면 계정을 만들지 않는다 (신청도 못 하는데 SOL 만 쓰게 된다).
 */
export function useTokenAccount(closesAt: string | null) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<TokenAccountStatus>("unknown");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 지갑을 바꾸거나 다시 확인하면 앞선 조회의 늦은 응답은 버린다 (이전 지갑 결과가 현재 지갑 상태를 덮지 않게)
  const latestCheck = useRef(0);
  const currentOwner = useRef(publicKey);
  useEffect(() => {
    currentOwner.current = publicKey;
  }, [publicKey]);
  const isCurrentOwner = (owner: PublicKey) => !!currentOwner.current?.equals(owner);

  /** 토큰 계정이 있으면 true. 더 새 조회가 시작됐거나 지갑이 바뀌었으면 결과를 반영하지 않고 false. */
  const check = useCallback(async (): Promise<boolean> => {
    const req = ++latestCheck.current;
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
      if (req !== latestCheck.current) return false;
      if (info) {
        setStatus("ready");
        return true;
      }
      const lamports = await connection.getBalance(publicKey, "confirmed");
      if (req !== latestCheck.current) return false;
      setSolBalance(lamports / LAMPORTS_PER_SOL);
      setStatus("missing");
    } catch {
      if (req !== latestCheck.current) return false;
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
    const owner = publicKey;
    const closed = () => closesAt !== null && Date.now() >= Date.parse(closesAt);
    if (closed()) return;
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
      // 블록해시를 받는 사이 마감됐거나 지갑이 바뀌었으면 보내지 않는다
      if (!isCurrentOwner(owner)) return;
      if (closed()) {
        setStatus("missing");
        return;
      }

      const signature = await sendTransaction(tx, connection);
      const { value } = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      // 확인은 실패한 트랜잭션도 결과로 돌려준다. 실패 여부를 보고, 실제 계정이 보일 때만 완료로 둔다
      if (value.err) throw new Error(`Token account transaction failed: ${JSON.stringify(value.err)}`);
      if (!isCurrentOwner(owner)) return;
      if (!(await check())) throw new Error("Token account not found after the transaction");
    } catch (err) {
      if (!isCurrentOwner(owner)) return;
      // 확인만 늦었을 수 있으니 실제 상태를 다시 본다
      if (await check()) return;
      const cancelled = err instanceof Error && /reject|cancel|denied/i.test(err.message);
      setError(cancelled ? "You cancelled the transaction. Approve it to create your TINA account." : "Your TINA account wasn't created. Check your SOL balance and try again.");
    }
  }, [publicKey, connection, sendTransaction, check, closesAt]);

  return { status, solBalance, error, create, recheck: check };
}
