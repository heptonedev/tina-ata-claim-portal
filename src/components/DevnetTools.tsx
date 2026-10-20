import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { SOLANA_NETWORK, TINA_MINT } from "@/lib/config";

// devnet 빌드(로컬·Firebase 개발 사이트)에서만 보이는 테스트 도구.
// TINA 계정(ATA)을 지워서 "Create your TINA account" 단계를 다시 테스트할 수 있게 한다.
// 잔고가 있으면 닫을 수 없어서 남은 devnet TINA 를 devnet System 지갑으로 먼저 돌려보낸다.

export const SHOW_DEVNET_TOOLS = SOLANA_NETWORK === "devnet";

const MINT = new PublicKey(TINA_MINT);
const RETURN_WALLET = new PublicKey("CgpbS1Mm9SJqhZQdtApcaQyCchyhYJ7qTttZRBwqSurN");
const DECIMALS = 9;

type AccountInfo = { status: "loading" } | { status: "none" } | { status: "active"; amount: bigint; ui: string };

function ataOf(owner: PublicKey) {
  return getAssociatedTokenAddressSync(MINT, owner, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

export default function DevnetTools({ refreshKey, onChanged }: { refreshKey: string; onChanged: () => void }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
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

  const remove = useCallback(async () => {
    if (!publicKey || account.status !== "active") return;
    setDeleting(true);
    setMessage(null);
    try {
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
      setMessage({
        tone: "ok",
        text:
          account.amount === 0n
            ? "TINA account deleted. You can create it again in step 3."
            : `TINA account deleted. ${account.ui} test TINA went back to the test treasury.`,
      });
      onChanged();
    } catch (err) {
      const cancelled = err instanceof Error && /reject|cancel|denied/i.test(err.message);
      setMessage({
        tone: "error",
        text: cancelled ? "You cancelled the transaction." : `Couldn't delete the account. ${err instanceof Error ? err.message : ""}`,
      });
    } finally {
      setDeleting(false);
      setConfirming(false);
      void load();
    }
  }, [publicKey, account, connection, sendTransaction, onChanged, load]);

  if (!publicKey) return null;

  return (
    <section className="mt-5 rounded-2xl border border-contour bg-panel/60 p-6 backdrop-blur-sm sm:p-7" aria-labelledby="devnet-tools-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f5a524]/12 px-2.5 py-1 text-xs font-semibold text-[#f7c46c]">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f5a524]" />
          Devnet test
        </span>
        <h2 id="devnet-tools-title" className="font-display text-lg font-semibold tracking-tight">
          Reset your TINA account
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Delete this wallet&apos;s test TINA account to try &ldquo;Create your TINA account&rdquo; again. Only shown on the test site.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-contour pt-4">
        <div className="min-w-0">
          <p className="text-xs text-muted">TINA account</p>
          <p className="mt-0.5 text-sm">
            {account.status === "loading" ? "Checking…" : account.status === "none" ? "Not created" : `Active · ${account.ui} TINA`}
          </p>
        </div>

        {account.status === "active" &&
          (confirming ? (
            <div className="flex items-center gap-1">
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
                onClick={() => void remove()}
                disabled={deleting}
                className="min-h-9 rounded-lg bg-stop px-4 text-sm font-semibold text-white hover:bg-[#f45d72] disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setConfirming(true);
              }}
              className="min-h-9 rounded-lg border border-contour-strong px-4 text-sm font-semibold text-paper transition-colors hover:border-stop hover:text-[#ffb3be]"
            >
              Delete TINA account
            </button>
          ))}
      </div>

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
