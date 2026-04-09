import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTinaToken } from "@/hooks/useTinaToken";
import AirdropCard from "@/components/AirdropCard";
import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import MapBackground from "@/components/MapBackground";
import { formatBalance } from "@/utils/format";

export default function App() {
  const { publicKey, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const tokenState = useTinaToken();

  const handleDisconnect = async () => {
    try { if (wallet?.adapter) await wallet.adapter.disconnect(); } catch {}
    try {
      await disconnect();
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem("walletName");
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  const shortAddr = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <div className="min-h-screen text-on-surface font-body selection:bg-primary selection:text-on-primary">
      {/* Animated map background with POI markers */}
      <MapBackground />
      <div className="fixed inset-0 -z-[5] pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] orb-1" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-tertiary/10 rounded-full blur-[120px] orb-2" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#030712]/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(52,254,160,0.04)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <img src="/tina-icon.png" alt="TINA" width={32} height={32} className="rounded-lg" />
              <span className="text-2xl font-bold tracking-tighter text-white font-headline">TINA</span>
            </div>
            <div className="hidden md:flex gap-6">
              <a href="#" className="text-on-surface-variant hover:text-white transition-colors font-headline tracking-tight">
                Airdrop
              </a>
            </div>
          </div>
          {publicKey ? (
            <button
              onClick={handleDisconnect}
              className="px-5 py-2.5 rounded-full text-sm font-bold border border-outline-variant/20 text-on-surface-variant hover:text-error-dim hover:border-error-dim/30 transition-all"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold tracking-tight active:scale-95 transition-transform flex items-center gap-2 text-sm"
            >
              Connect Wallet
            </button>
          )}
        </div>
        <div className="divider-gradient" />
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {/* Wallet Connected Banner */}
        {publicKey && (
          <section className="mb-12 fade-in">
            <div className="relative overflow-hidden rounded-full bg-surface-container-low p-1 border border-outline-variant/15">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50" />
              <div className="relative flex items-center justify-between px-8 py-4 bg-surface-container rounded-full">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Wallet Connected</p>
                    <p className="font-headline font-bold text-lg text-on-surface tracking-tight">{shortAddr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Network</p>
                    <p className="text-sm font-semibold text-tertiary">Solana Mainnet</p>
                  </div>
                  <div className="h-8 w-[1px] bg-outline-variant/30 hidden sm:block" />
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">SOL</p>
                    <p className="text-sm font-semibold text-on-surface">
                      {tokenState.solBalance !== null ? formatBalance(tokenState.solBalance) : "---"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Main Action */}
          <div className="lg:col-span-7 space-y-8">
            <header className="fade-in-d1">
              <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter text-on-surface mb-4 leading-[1.1]">
                {!publicKey
                  ? <>Claim Your <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">Airdrop</span></>
                  : !tokenState.hasAta && !tokenState.loading
                    ? <>Initialize Your <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">Vault</span></>
                    : <>TINA <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">Airdrop</span></>
                }
              </h1>
              <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed">
                {!publicKey
                  ? "TINA is a location-based reward platform where you discover places, complete missions, and earn rewards. Connect your Solana wallet to claim your TINA token airdrop."
                  : !tokenState.hasAta && !tokenState.loading
                    ? "To receive TINA tokens, you need an Associated Token Account (ATA) on the Solana Token-2022 program. Create one to get started."
                    : "Your ATA is active. Claim your airdrop below."
                }
              </p>
            </header>
            <div className="fade-in-d2">
              <AirdropCard tokenState={tokenState} />
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-5 fade-in-d3">
            <Sidebar tokenState={tokenState} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#030712]">
        <div className="max-w-7xl mx-auto px-8 py-12 border-t border-surface-container-highest">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex flex-col gap-3 max-w-md">
              <div className="flex items-center gap-2">
                <img src="/tina-icon.png" alt="TINA" width={20} height={20} className="rounded" />
                <span className="text-lg font-black text-white font-headline">TINA</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Discover places, complete missions, and earn rewards on the map. TINA turns your everyday movement into data and connects it to rewards.
              </p>
              <p className="text-xs text-outline mt-1">
                Built on Solana &middot; SPL Token-2022
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Links</span>
              <a
                href="https://solscan.io/token/BJUP7hZoN8GFunH3ucrdBjuphyz2Ryg1R8pt3D4tm6wZ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-outline hover:text-tertiary transition-colors"
              >
                Solscan
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast */}
      <Toast
        message={tokenState.successMessage ?? ""}
        type="success"
        open={!!tokenState.successMessage}
        onClose={tokenState.clearSuccess}
      />
      <Toast
        message={tokenState.error ?? ""}
        type="error"
        open={!!tokenState.error}
        onClose={() => {}}
      />
    </div>
  );
}
