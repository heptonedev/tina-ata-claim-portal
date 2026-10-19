import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import AccountPanel from "@/components/AccountPanel";
import Button from "@/components/Button";
import Note from "@/components/Note";
import RouteStop, { type StopState } from "@/components/RouteStop";
import GalxeMark from "@/components/GalxeMark";
import Topography from "@/components/Topography";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useClaim } from "@/hooks/useClaim";
import { useGalxeSession } from "@/hooks/useGalxeSession";
import { ATA_COST_SOL, useTokenAccount } from "@/hooks/useTokenAccount";
import { formatSol, shortAddress } from "@/lib/format";

export default function App() {
  const { publicKey, disconnect } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const galxe = useGalxeSession();
  const campaigns = useCampaigns();

  const onSessionExpired = useCallback((message: string) => galxe.signOut(message), [galxe]);
  const claim = useClaim(galxe.markClaimed, onSessionExpired);
  const tokenAccount = useTokenAccount();

  const session = galxe.state.status === "ready" ? galxe.state.session : null;
  const signedIn = !!session;
  const claimed = session?.claim ?? null;
  const canContinue = signedIn && session.eligible && !claimed;
  const walletReady = canContinue && !!publicKey;
  // 토큰 계정(ATA)은 신청자가 직접 만든다 (보관료 SOL 을 신청자가 낸다)
  const accountReady = walletReady && tokenAccount.status === "ready";

  // 포인트가 없으면 1단계에 머문다 (경로가 다음 단계로 이어지지 않게)
  const stop1: StopState = signedIn && (session.eligible || claimed) ? "done" : "current";
  const stop2: StopState = claimed || walletReady ? "done" : canContinue ? "current" : "upcoming";
  const stop3: StopState = claimed || accountReady ? "done" : walletReady ? "current" : "upcoming";
  const stop4: StopState = claimed ? "done" : accountReady ? "current" : "upcoming";

  return (
    <div className="relative min-h-screen">
      <Topography />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <GalxeMark />
        {publicKey && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{shortAddress(publicKey.toBase58())}</span>
            <button onClick={() => disconnect()} className="rounded-md px-2 py-1 text-muted hover:text-paper">
              Disconnect
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-5 pt-6 pb-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:pt-14">
        <section>
          <h1 className="max-w-[14ch] font-display text-[2.6rem] leading-[1.02] font-bold tracking-[-0.03em] [font-stretch:85%] sm:text-6xl">
            Claim TINA for your Galxe quests
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
            Earned points in a TINA campaign on Galxe? Sign in with Galxe, connect a Solana wallet, create your TINA account, and claim.
          </p>

          <ol className="mt-12">
            <RouteStop index={1} title="Sign in with Galxe" state={stop1}>
              <GalxeStep galxe={galxe} />
            </RouteStop>

            <RouteStop index={2} title="Connect your Solana wallet" state={stop2}>
              {claimed ? (
                <p className="text-muted">Wallet {shortAddress(claimed.walletAddress)}</p>
              ) : canContinue && (
                publicKey ? (
                  <p className="text-muted">TINA will be sent to {shortAddress(publicKey.toBase58())}</p>
                ) : (
                  <>
                    <p className="max-w-prose leading-relaxed text-muted">TINA will be sent to this wallet.</p>
                    <Button className="mt-4" onClick={() => openWalletModal(true)}>Connect wallet</Button>
                  </>
                )
              )}
            </RouteStop>

            <RouteStop index={3} title="Create your TINA account" state={stop3}>
              {!claimed && walletReady && (
                <TokenAccountStep tokenAccount={tokenAccount} />
              )}
            </RouteStop>

            <RouteStop index={4} title="Claim your TINA" state={stop4} last>
              {claimed ? (
                <Note tone="success">
                  Claim received. TINA will be sent to {shortAddress(claimed.walletAddress)} after the campaign ends.
                </Note>
              ) : accountReady && session && (
                <>
                  <p className="max-w-prose leading-relaxed text-muted">
                    Sign a message to prove you own this wallet. Signing is free and doesn't move any funds.
                  </p>
                  <Button className="mt-4" busy={claim.phase !== "idle"} onClick={() => claim.claim(session.sessionToken)}>
                    {claim.phase === "signing" ? "Waiting for signature" : claim.phase === "submitting" ? "Sending claim" : "Sign and claim"}
                  </Button>
                  {claim.error && <Note tone="error">{claim.error}</Note>}
                </>
              )}
            </RouteStop>
          </ol>
        </section>

        <div className="lg:pt-3">
          <AccountPanel session={session} campaigns={campaigns} />
        </div>
      </main>
    </div>
  );
}

function TokenAccountStep({ tokenAccount }: { tokenAccount: ReturnType<typeof useTokenAccount> }) {
  const { status, solBalance, error } = tokenAccount;

  if (status === "unknown" || status === "checking") {
    return <p className="text-muted">Checking your wallet…</p>;
  }
  if (status === "ready") {
    return <p className="text-muted">Your wallet can receive TINA.</p>;
  }

  const short = solBalance !== null && solBalance < ATA_COST_SOL;
  return (
    <>
      <p className="max-w-prose leading-relaxed text-muted">
        Your wallet needs a TINA account to receive TINA. Creating it costs about {formatSol(ATA_COST_SOL)} SOL, paid from this wallet.
      </p>
      {short && (
        <Note>
          This wallet has {formatSol(solBalance)} SOL. Add at least {formatSol(ATA_COST_SOL)} SOL, then check again.
        </Note>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {short ? (
          <Button onClick={() => void tokenAccount.recheck()}>Check again</Button>
        ) : (
          <Button busy={status === "creating"} onClick={tokenAccount.create}>
            {status === "creating" ? "Creating account" : "Create TINA account"}
          </Button>
        )}
      </div>
      {error && <Note tone="error">{error}</Note>}
    </>
  );
}

function GalxeStep({ galxe }: { galxe: ReturnType<typeof useGalxeSession> }) {
  const { state } = galxe;

  if (state.status === "waiting") {
    return (
      <>
        <p className="max-w-prose leading-relaxed text-muted">Finish signing in with Galxe in the popup window.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="quiet" onClick={galxe.showPopup}>Show the Galxe window</Button>
          <Button variant="quiet" onClick={galxe.continueInThisWindow}>Sign in on this page instead</Button>
        </div>
      </>
    );
  }

  if (state.status === "checking") {
    return <p className="text-muted">Checking your points in both campaigns…</p>;
  }

  if (state.status === "idle") {
    return (
      <>
        <p className="max-w-prose leading-relaxed text-muted">
          We check your points in the TINA campaigns on Galxe. Nothing is posted to your account.
        </p>
        <Button className="mt-4" onClick={galxe.signIn}>Sign in with Galxe</Button>
        {state.error && <Note tone="error">{state.error}</Note>}
      </>
    );
  }

  const { session } = state;
  const switchAccount = (
    <Button variant="quiet" onClick={() => { galxe.signOut(); galxe.signIn(); }}>
      Sign in with another account
    </Button>
  );

  if (session.claim) {
    return (
      <>
        <p className="text-muted">Signed in as Galxe ID {session.galxeId}</p>
        <Note>This Galxe account has already claimed.</Note>
      </>
    );
  }

  if (!session.eligible) {
    return (
      <>
        <p className="text-muted">Signed in as Galxe ID {session.galxeId}</p>
        <Note>
          {session.hasLinkedAddress
            ? "This Galxe account didn't earn points in either TINA campaign, so it can't claim. If you did the quests with another Galxe account, sign in with that one."
            : "This Galxe account has no linked wallet, so no points could be found. Link the wallet you used for the quests on Galxe, then sign in again."}
        </Note>
        <div className="mt-4">{switchAccount}</div>
      </>
    );
  }

  const total = session.campaigns.reduce((sum, c) => sum + c.points, 0);
  return (
    <p className="text-muted">
      Signed in as Galxe ID {session.galxeId}.{" "}
      <span className="font-medium text-reach">You're eligible with {total.toLocaleString()} points.</span>
    </p>
  );
}
