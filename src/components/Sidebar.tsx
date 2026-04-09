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
      {/* About TINA */}
      <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/10">
        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant mb-6">
          About TINA
        </h4>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
          TINA is a location-based reward platform. Discover &amp; register places on the map, complete missions, and earn Biscuits — redeemable for TINA tokens.
        </p>
        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface mb-1">Map &amp; POI</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Explore, register, and verify places on a community-driven map.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
              </svg>
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface mb-1">Missions &amp; Rewards</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Drive, check in, snap photos — complete missions to earn Biscuits.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
              </svg>
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface mb-1">Solana Token-2022</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">TINA token runs on Solana's Token-2022 with extended metadata and transfer hooks.</p>
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
            <span className="text-2xl font-headline font-bold">
              {loading ? "---" : solBalance !== null ? formatBalance(solBalance) : "---"}
            </span>
          </div>
          {/* TINA */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
            <span className="text-on-surface-variant text-[10px] tracking-[0.2em] uppercase font-bold block mb-2">TINA</span>
            <span className="text-2xl font-headline font-bold text-primary">
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
