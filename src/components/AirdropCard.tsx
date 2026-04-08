import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { TinaTokenState } from "@/hooks/useTinaToken";
import { formatBalance } from "@/utils/format";

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function AirdropCard({ tokenState }: { tokenState: TinaTokenState }) {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { hasAta, tinaBalance, loading, creating, closing, claiming, error, createAta, closeAta, claimAirdrop } = tokenState;

  return (
    <div className="glass-card rounded-[2rem] p-8 md:p-10 border border-outline-variant/10 glow-primary relative overflow-hidden">
      {/* Glow orb */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col gap-8">
        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        {/* Status Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/20">
              {loading ? (
                <Spinner size={28} />
              ) : !publicKey ? (
                <svg className="w-8 h-8 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                </svg>
              ) : hasAta ? (
                <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-headline font-bold text-on-surface tracking-tight">
                {loading ? "Verifying..." : !publicKey ? "Wallet Not Connected" : hasAta ? "ATA Active" : "ATA Not Found"}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {loading ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-outline-variant/20 text-on-surface-variant text-[11px] font-black uppercase tracking-wider border border-outline-variant/20">
                    Verifying...
                  </span>
                ) : !publicKey ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-outline-variant/20 text-on-surface-variant text-[11px] font-black uppercase tracking-wider border border-outline-variant/20">
                    Wallet Required
                  </span>
                ) : hasAta ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider border border-primary/20">
                    Verified On-Chain
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-error/10 text-error-dim text-[11px] font-black uppercase tracking-wider border border-error-dim/20">
                    ATA Not Found
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        {publicKey && !loading && (
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10">
            <div className="flex items-start gap-4">
              <svg className="w-5 h-5 text-tertiary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <div className="space-y-2">
                <p className="text-sm text-on-surface leading-snug">
                  {hasAta ? (
                    <>
                      Your TINA token account is active.
                      <br />Click the button below to claim your airdrop.
                    </>
                  ) : (
                    <>
                      Your wallet is connected but lacks a TINA token account.
                      <br />Create an ATA first to receive the airdrop.
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-on-surface-variant tracking-widest uppercase mt-1">
                  <span>Program: Token-2022</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant" />
                  <span>Rent-Exempt: ~0.002 SOL</span>
                  {hasAta && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span>Balance: {tinaBalance !== null ? formatBalance(tinaBalance) : "0"} TINA</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TINA Balance (when ATA exists) */}
        {publicKey && !loading && hasAta && (
          <div>
            <div className="text-6xl md:text-7xl font-black font-headline tracking-tight">
              {tinaBalance !== null ? formatBalance(tinaBalance) : "0"}
            </div>
            <div className="text-primary font-bold tracking-[0.3em] text-sm uppercase mt-2">TINA Balance</div>
          </div>
        )}

        {/* CTA Button */}
        {!publicKey ? (
          <button
            onClick={() => setVisible(true)}
            className="w-full group bg-primary hover:bg-primary-dim text-on-primary py-5 rounded-2xl font-bold text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
          >
            Connect Wallet
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        ) : loading ? (
          <div className="h-16 w-full bg-surface-container-highest rounded-2xl animate-pulse" />
        ) : !hasAta ? (
          <button
            onClick={createAta}
            disabled={creating}
            className="w-full group bg-primary hover:bg-primary-dim text-on-primary py-5 rounded-2xl font-bold text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? (
              <><Spinner /> Creating ATA...</>
            ) : (
              <>
                Create TINA Token Account
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={claimAirdrop}
              disabled={claiming}
              className="flex-1 group bg-primary hover:bg-primary-dim text-on-primary py-5 rounded-2xl font-bold text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {claiming ? (
                <><Spinner /> Claiming...</>
              ) : (
                <>
                  Claim Airdrop
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
            <button
              onClick={closeAta}
              disabled={closing || (tinaBalance !== null && tinaBalance > 0)}
              className="px-6 py-5 rounded-2xl text-sm font-bold border border-outline-variant/20 text-on-surface-variant hover:text-error-dim hover:border-error-dim/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {closing ? <Spinner size={16} /> : "Close ATA"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
