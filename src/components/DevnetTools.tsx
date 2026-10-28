import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { ApiError, resetClaimForTest } from "@/lib/api";
import { SOLANA_NETWORK, TINA_MINT } from "@/lib/config";

// devnet 빌드(로컬·Firebase 개발 사이트)에서만 보이는 테스트 도구.
// 버튼 하나로 신청 기록(dev API)과 TINA 계정(ATA)을 함께 지워 처음부터 다시 테스트할 수 있게 한다.
// ATA 는 잔고가 있으면 닫을 수 없어서 남은 devnet TINA 를 devnet System 지갑으로 먼저 돌려보낸다.

export const SHOW_DEVNET_TOOLS = SOLANA_NETWORK === "devnet";

const MINT = new PublicKey(TINA_MINT);
const RETURN_WALLET = new PublicKey("CgpbS1Mm9SJqhZQdtApcaQyCchyhYJ7qTttZRBwqSurN");
const DECIMALS = 9;

type AccountInfo = { status: "loading" } | { status: "none" } | { status: "active"; amount: bigint; ui: string };

function ataOf(owner: PublicKey) {
  return getAssociatedTokenAddressSync(MINT, owner, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

type Props = {
  /** 바뀌면 계정 상태를 다시 읽는다 */
  refreshKey: string;
  /** Galxe 로그인 세션 (없으면 신청 초기화는 하지 않는다) */
  sessionToken: string | null;
  claimed: boolean;
  onClaimReset: () => void;
  onAccountChanged: () => void;
};

export default function DevnetTools({ refreshKey, sessionToken, claimed, onClaimReset, onAccountChanged }: Props) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const [account, setAccount] = useState<AccountInfo>({ status: "loading" });
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!publicKey) return;
    setAccount({ status: "loading" });
    try {
      const address = ataOf(publicKey);
      if (!(await connection.getAccountInfo(address, "confirmed"))) {
        setAccount({ status: "none" });
        return;
      }
      const { value } = await connection.getTokenAccountBalance(address, "confirmed");
      setAccount({ status: "active", amount: BigInt(value.amount), ui: value.uiAmountString ?? "0" });
    } catch {
      setAccount({ status: "none" });
    }
  }, [publicKey, connection]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const reset = useCallback(async () => {
    if (!publicKey) return;
    setDeleting(true);
    setMessage(null);
    const done: string[] = [];
    try {
      // 1) 신청 기록 (dev API)
      if (claimed && sessionToken) {
        await resetClaimForTest(sessionToken);
        onClaimReset();
        done.push("claim");
      }
      // 2) TINA 계정
      if (account.status === "active") {
        const address = ataOf(publicKey);
        const tx = new Transaction();
        if (account.amount > 0n) {
          tx.add(
            createTransferCheckedInstruction(address, MINT, ataOf(RETURN_WALLET), publicKey, account.amount, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
          );
        }
        tx.add(createCloseAccountInstruction(address, publicKey, publicKey, [], TOKEN_2022_PROGRAM_ID));
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;
        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
        onAccountChanged();
        done.push("account");
      }
      setMessage({ tone: "ok", text: "Reset done. You can run the whole flow again." });
    } catch (err) {
      const cancelled = err instanceof Error && /reject|cancel|denied/i.test(err.message);
      const reason =
        err instanceof ApiError ? err.message : cancelled ? "You cancelled the transaction." : err instanceof Error ? err.message : "";
      setMessage({
        tone: "error",
        text: done.includes("claim") ? `Your claim was reset, but the TINA account wasn't deleted. ${reason}` : `Reset failed. ${reason}`,
      });
    } finally {
      setDeleting(false);
      setConfirming(false);
      void load();
    }
  }, [publicKey, claimed, sessionToken, account, connection, sendTransaction, onClaimReset, onAccountChanged, load]);

  const canReset = (claimed && !!sessionToken) || account.status === "active";

  // 신청을 마친 뒤 다시 들어오면 지갑이 연결돼 있지 않다. 카드를 숨기면 리셋할 방법이 없으므로 연결 버튼을 보여준다.
  return (
    <section className="mt-5 rounded-2xl border border-contour bg-panel/60 p-6 backdrop-blur-sm sm:p-7" aria-labelledby="devnet-tools-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f5a524]/12 px-2.5 py-1 text-xs font-semibold text-[#f7c46c]">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f5a524]" />
          Devnet test
        </span>
        <h2 id="devnet-tools-title" className="font-display text-lg font-semibold tracking-tight">
          Reset for testing
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Deletes your claim and this wallet&apos;s test TINA account so you can run the whole flow again. Only shown on the test site.
      </p>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-contour pt-4 text-sm">
        <dt className="text-muted">Claim</dt>
        <dd className="text-right">{sessionToken ? (claimed ? "Received" : "Not claimed") : "Sign in to see"}</dd>
        <dt className="text-muted">TINA account</dt>
        <dd className="text-right">
          {!publicKey
            ? "Connect wallet to see"
            : account.status === "loading"
              ? "Checking…"
              : account.status === "none"
                ? "Not created"
                : `Active · ${account.ui} TINA`}
        </dd>
      </dl>

      {!publicKey ? (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <p className="mr-auto text-sm text-muted">Connect your wallet to reset.</p>
          <button
            type="button"
            onClick={() => openWalletModal(true)}
            className="min-h-9 rounded-lg border border-contour-strong px-4 text-sm font-semibold text-paper transition-colors hover:border-paper"
          >
            Connect wallet
          </button>
        </div>
      ) : canReset && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-1">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="min-h-9 rounded-md px-3 text-sm font-semibold text-muted hover:text-paper disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void reset()}
                disabled={deleting}
                className="min-h-9 rounded-lg bg-stop px-4 text-sm font-semibold text-white hover:bg-[#f45d72] disabled:opacity-60"
              >
                {deleting ? "Resetting…" : "Reset"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setConfirming(true);
              }}
              className="min-h-9 rounded-lg border border-contour-strong px-4 text-sm font-semibold text-paper transition-colors hover:border-stop hover:text-[#ffb3be]"
            >
              Reset for testing
            </button>
          )}
        </div>
      )}

      {confirming && !deleting && account.status === "active" && account.amount > 0n && (
        <p className="mt-3 text-sm text-muted">{account.ui} test TINA in this account goes back to the test treasury first.</p>
      )}
      {message && (
        <p role={message.tone === "error" ? "alert" : undefined} className={`mt-3 break-words text-sm ${message.tone === "error" ? "text-[#ffb3be]" : "text-[#a8ecc6]"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
