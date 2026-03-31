"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import type { TinaTokenState } from "@/hooks/useTinaToken";
import { formatBalance } from "@/utils/format";

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Sidebar({ tokenState }: { tokenState: TinaTokenState }) {
  const { publicKey } = useWallet();
  const { hasAta, ataAddress, tinaBalance, solBalance, loading } = tokenState;

  return (
    <div className="space-y-6">
      {/* Why Token-2022? */}
      <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/10">
        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant mb-6">
          Why Token-2022?
        </h4>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <p className="font-[family-name:var(--font-headline)] font-bold text-on-surface mb-1">Confidential Transfers</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Enhanced privacy features for institutional-grade asset management.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            </div>
            <div>
              <p className="font-[family-name:var(--font-headline)] font-bold text-on-surface mb-1">Extended Metadata</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Native support for complex on-chain asset data and attributes.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
            </div>
            <div>
              <p className="font-[family-name:var(--font-headline)] font-bold text-on-surface mb-1">Transfer Hooks</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Custom logic executed on every transfer for ecosystem compliance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Info Cards (when connected) */}
      {publicKey && (
        <div className="grid grid-cols-2 gap-4">
          {/* SOL */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
            <span className="text-on-surface-variant text-[10px] tracking-[0.2em] uppercase font-bold block mb-2">SOL</span>
            <span className="text-2xl font-[family-name:var(--font-headline)] font-bold">
              {loading ? "---" : solBalance !== null ? formatBalance(solBalance) : "---"}
            </span>
          </div>
          {/* TINA */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
            <span className="text-on-surface-variant text-[10px] tracking-[0.2em] uppercase font-bold block mb-2">TINA</span>
            <span className="text-2xl font-[family-name:var(--font-headline)] font-bold text-primary">
              {loading ? "---" : tinaBalance !== null ? formatBalance(tinaBalance) : "0"}
            </span>
          </div>
        </div>
      )}

      {/* ATA Address */}
      {publicKey && hasAta && ataAddress && (
        <div className="bg-surface-container-highest rounded-2xl p-6 border border-primary/15 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-bold">ATA Address</span>
            <span className="font-mono text-sm text-on-surface/80">{shortenAddress(ataAddress)}</span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(ataAddress)}
            className="text-primary/60 hover:text-primary transition-colors p-2"
            title="Copy address"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
          </button>
        </div>
      )}

      {/* Rent Exempt Info */}
      {publicKey && (
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant mb-4">
            Rent Exempt
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">ATA Creation Cost</span>
              <span className="text-sm font-semibold text-on-surface">~0.00203928 SOL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">Status</span>
              {hasAta ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                  Covered
                </span>
              ) : (
                <span className="text-sm text-on-surface-variant">ATA Not Created</span>
              )}
            </div>
            {hasAta && (
              <p className="text-[11px] text-on-surface-variant pt-1">
                Closing ATA will return rent SOL to your wallet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
