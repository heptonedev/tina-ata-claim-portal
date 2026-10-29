import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
/** 조회 결과. stale 은 더 새 조회가 시작됐거나 연결이 바뀌어 결과를 버렸다는 뜻이다 (상태는 새 조회가 정한다). */
type CheckResult = "ready" | "missing" | "error" | "stale";

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

  // 지갑 연결이 바뀔 때마다 세대 번호를 올린다. 이전 연결에서 시작한 조회·생성의 늦은 결과는 버린다
  // (A→B→A 처럼 주소가 같아도 연결이 바뀌었으면 버린다). 같은 연결에서 다시 조회하면 앞선 조회 결과도 버린다.
  // 전송 여부를 가르는 값이라 화면 반영 직후(useLayoutEffect) 바로 갱신한다. useEffect 는 그 사이에 이전 값이 보인다.
  const currentOwner = useRef(publicKey);
  const generation = useRef(0);
  const latestCheck = useRef(0);
  useLayoutEffect(() => {
    currentOwner.current = publicKey;
    generation.current += 1;
  }, [publicKey]);
  // 마감 시각은 생성 도중에 서버 응답으로 바뀔 수 있어 항상 최신 값을 본다
  const latestClosesAt = useRef(closesAt);
  useLayoutEffect(() => {
    latestClosesAt.current = closesAt;
  }, [closesAt]);
  const isClosed = () => latestClosesAt.current !== null && Date.now() >= Date.parse(latestClosesAt.current);

  /** 토큰 계정을 조회한다. 이전 연결의 콜백이거나 더 새 조회가 시작됐으면 결과를 반영하지 않고 "stale". */
  const check = useCallback(async (): Promise<CheckResult> => {
    // 이전 연결의 check 가 늦게 불리면 현재 지갑 상태를 건드리지 않는다
    if (publicKey ? !currentOwner.current?.equals(publicKey) : currentOwner.current !== null) return "stale";
    const gen = generation.current;
    const req = ++latestCheck.current;
    const stale = () => req !== latestCheck.current || gen !== generation.current;
    if (!publicKey) {
      setStatus("unknown");
      setSolBalance(null);
      return "missing";
    }
    setStatus("checking");
    setError(null);
    try {
      const ata = getAssociatedTokenAddressSync(MINT, publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      // 공용 RPC 호출 제한 때문에 차례로 부른다
      const info = await connection.getAccountInfo(ata, "confirmed");
      if (stale()) return "stale";
      if (info) {
        setStatus("ready");
        return "ready";
      }
      const lamports = await connection.getBalance(publicKey, "confirmed");
      if (stale()) return "stale";
      setSolBalance(lamports / LAMPORTS_PER_SOL);
      setStatus("missing");
      return "missing";
    } catch {
      if (stale()) return "stale";
      setStatus("missing");
      setError("Couldn't check your wallet. Try again.");
      return "error";
    }
  }, [publicKey, connection]);

  useEffect(() => {
    void check();
  }, [check]);

  const create = useCallback(async () => {
    if (!publicKey || !currentOwner.current?.equals(publicKey) || isClosed()) return;
    const gen = generation.current;
    const alive = () => gen === generation.current;
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
      if (!alive()) return;
      if (isClosed()) {
        setStatus("missing");
        return;
      }

      const signature = await sendTransaction(tx, connection);
      const { value } = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      // 확인은 실패한 트랜잭션도 결과로 돌려준다. 실패 여부를 보고, 실제 계정이 보일 때만 완료로 둔다
      if (value.err) throw new Error(`Token account transaction failed: ${JSON.stringify(value.err)}`);
      if (!alive()) return;
      // stale 이면 더 새 조회가 상태를 정한다. 그 결과를 실패로 덮지 않는다
      const result = await check();
      if (result !== "ready" && result !== "stale") throw new Error("Token account not found after the transaction");
    } catch (err) {
      if (!alive()) return;
      // 확인만 늦었을 수 있으니 실제 상태를 다시 본다
      const result = await check();
      if (result === "ready" || result === "stale" || !alive()) return;
      const cancelled = err instanceof Error && /reject|cancel|denied/i.test(err.message);
      setError(cancelled ? "You cancelled the transaction. Approve it to create your TINA account." : "Your TINA account wasn't created. Check your SOL balance and try again.");
    }
  }, [publicKey, connection, sendTransaction, check]);

  return { status, solBalance, error, create, recheck: check };
}
