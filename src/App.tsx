import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import DevnetTools, { SHOW_DEVNET_TOOLS } from "@/components/DevnetTools";
import Button from "@/components/Button";
import ClaimTerms from "@/components/ClaimTerms";
import Hero from "@/components/Hero";
import Note from "@/components/Note";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import StepCard, { StepActions, StepText, type StepState } from "@/components/StepCard";
import { useEventInfo } from "@/hooks/useEventInfo";
import { useClaim } from "@/hooks/useClaim";
import { useDeadlinePassed } from "@/hooks/useDeadlinePassed";
import { useGalxeSession } from "@/hooks/useGalxeSession";
import { ATA_COST_SOL, useTokenAccount } from "@/hooks/useTokenAccount";
import { PAYOUT_START } from "@/lib/config";
import { formatDeadline, formatSol, shortAddress, shortId } from "@/lib/format";

export default function App() {
  const { publicKey, disconnect } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const galxe = useGalxeSession();
  const { closesAt } = useEventInfo();
  const closed = useDeadlinePassed(closesAt);

  const onSessionExpired = useCallback((message: string) => galxe.signOut(message), [galxe]);
  const claim = useClaim(galxe.markClaimed, onSessionExpired);
  const tokenAccount = useTokenAccount(closesAt);

  const session = galxe.state.status === "ready" ? galxe.state.session : null;
  const signedIn = !!session;
  const claimed = session?.claim ?? null;
  // 마감 뒤에는 TINA 계정 생성(SOL 지출)과 신청으로 넘어가지 않는다. 서버도 마감 후 신청을 거절한다.
  const canContinue = signedIn && session.eligible && !claimed && !closed;
  const walletReady = canContinue && !!publicKey;
  // 토큰 계정(ATA)은 신청자가 직접 만든다 (보관료 SOL 을 신청자가 낸다)
  const accountReady = walletReady && tokenAccount.status === "ready";

  // 포인트가 없으면 1단계에 머문다 (다음 단계로 넘어가지 않게)
  const step1: StepState = signedIn && (session.eligible || claimed) ? "done" : "current";
  const step2: StepState = claimed || walletReady ? "done" : canContinue ? "current" : "upcoming";
  const step3: StepState = claimed || accountReady ? "done" : walletReady ? "current" : "upcoming";
  const step4: StepState = claimed ? "done" : accountReady ? "current" : "upcoming";

  // 헤더 Sign in 은 Galxe 로그인 전에만 보인다 (마감 뒤에는 숨긴다)
  const canSignIn = galxe.state.status === "idle" && !closed;

  return (
    <div className="min-h-screen bg-page text-white">
      <Hero>
        <SiteHeader
          walletAddress={publicKey?.toBase58() ?? null}
          onSignIn={canSignIn ? galxe.signIn : null}
          onDisconnect={() => void disconnect()}
        />
      </Hero>

      <main className="flex justify-center bg-claim px-10 py-36 max-lg:px-8 max-lg:py-[120px] max-sm:px-5 max-sm:py-24">
        <div className="grid w-full max-w-[1200px] gap-16 lg:grid-cols-[473px_minmax(0,1fr)] max-lg:gap-12">
          <section className="flex flex-col items-start gap-5">
            <h2 className="text-[40px] leading-[1.25] font-bold tracking-[-1.13px] max-lg:text-[34px] max-lg:tracking-[-0.8px] max-sm:text-[30px] max-sm:tracking-[-0.7px]">
              Claim Your Loyalty Points as TINA
            </h2>
            <p className="text-base leading-[1.625] tracking-[0.09px] text-white/70 max-sm:text-[15px] max-sm:tracking-[0.144px]">
              Every loyalty point you earned in the TINA campaigns on Galxe is worth 1 TINA. Sign in with Galxe, connect your Solana wallet, create your TINA token account, and submit your claim.
            </p>
            {closesAt && (
              <p className="flex items-center gap-2 pt-1 text-sm leading-[1.4] font-semibold tracking-[0.2px] text-accent-soft">
                <img src="/galxe/icon-clock.svg" alt="" width={18} height={18} className="size-[18px] shrink-0" />
                {closed ? `Claims closed on ${formatDeadline(closesAt)}.` : `Claims close ${formatDeadline(closesAt)}.`}
              </p>
            )}
          </section>

          <div>
            <ol className="flex flex-col gap-6 max-lg:gap-5">
              <StepCard index={1} title="Sign in with Galxe" state={step1}>
                <GalxeStep galxe={galxe} closed={closed} />
              </StepCard>

              <StepCard index={2} title="Connect your Solana wallet" state={step2}>
                {claimed ? (
                  <StepText done>Wallet connected · {shortAddress(claimed.walletAddress)}</StepText>
                ) : canContinue && (
                  publicKey ? (
                    <StepText done>Wallet connected · {shortAddress(publicKey.toBase58())}</StepText>
                  ) : (
                    <>
                      <StepText>TINA will be sent to this wallet.</StepText>
                      <StepActions>
                        <Button onClick={() => openWalletModal(true)}>Connect wallet</Button>
                      </StepActions>
                    </>
                  )
                )}
              </StepCard>

              <StepCard index={3} title="Create your TINA account" state={step3}>
                {claimed ? (
                  <StepText done>Your wallet can receive TINA.</StepText>
                ) : walletReady && (
                  <TokenAccountStep tokenAccount={tokenAccount} />
                )}
              </StepCard>

              <StepCard index={4} title="Claim your TINA" state={step4}>
                {claimed ? (
                  <>
                    <StepText done>
                      Your TINA will be sent to {shortAddress(claimed.walletAddress)} in batches starting {PAYOUT_START}, after verification.
                    </StepText>
                    <Note tone="success">Claim received.</Note>
                  </>
                ) : accountReady && session && (
                  <>
                    <StepText>Sign a message to prove you own this wallet. Signing is free and doesn't move any funds.</StepText>
                    {claim.error && <Note tone="error">{claim.error}</Note>}
                    <StepActions>
                      <Button busy={claim.phase !== "idle"} onClick={() => claim.claim(session.sessionToken)}>
                        {claim.phase === "signing" ? "Waiting for signature" : claim.phase === "submitting" ? "Sending claim" : "Sign and claim"}
                      </Button>
                    </StepActions>
                  </>
                )}
              </StepCard>
            </ol>

            {SHOW_DEVNET_TOOLS && (
              <DevnetTools
                refreshKey={tokenAccount.status}
                sessionToken={session?.sessionToken ?? null}
                claimed={!!claimed}
                onClaimReset={galxe.markUnclaimed}
                onAccountChanged={() => void tokenAccount.recheck()}
              />
            )}
          </div>
        </div>
      </main>

      <ClaimTerms />
      <SiteFooter />
    </div>
  );
}

function TokenAccountStep({ tokenAccount }: { tokenAccount: ReturnType<typeof useTokenAccount> }) {
  const { status, solBalance, error } = tokenAccount;

  if (status === "unknown" || status === "checking") {
    return <StepText>Checking your wallet…</StepText>;
  }
  if (status === "ready") {
    return <StepText done>Your wallet can receive TINA.</StepText>;
  }

  const short = solBalance !== null && solBalance < ATA_COST_SOL;
  return (
    <>
      <StepText>
        Your wallet needs a TINA account to receive TINA. Creating it costs about {formatSol(ATA_COST_SOL)} SOL, paid from this wallet.
      </StepText>
      {short && (
        <Note>
          This wallet has {formatSol(solBalance)} SOL. Add at least {formatSol(ATA_COST_SOL)} SOL, then check again.
        </Note>
      )}
      {error && <Note tone="error">{error}</Note>}
      <StepActions>
        {short ? (
          <Button variant="secondary" onClick={() => void tokenAccount.recheck()}>Check again</Button>
        ) : (
          <Button busy={status === "creating"} onClick={tokenAccount.create}>
            {status === "creating" ? "Creating account" : "Create TINA account"}
          </Button>
        )}
      </StepActions>
    </>
  );
}

function GalxeStep({ galxe, closed }: { galxe: ReturnType<typeof useGalxeSession>; closed: boolean }) {
  const { state } = galxe;
  const closedNote = <Note>Claims are closed. Thanks for joining the TINA campaigns.</Note>;

  // 마감 뒤에는 로그인·조회 안내 대신 마감 안내를 먼저 보인다 (이미 신청한 계정의 완료 표시만 유지)
  if (state.status !== "ready" && closed) return closedNote;

  if (state.status === "waiting") {
    return (
      <>
        <StepText>Finish signing in with Galxe in the popup window.</StepText>
        <StepActions>
          <Button variant="secondary" onClick={galxe.showPopup}>Show the Galxe window</Button>
          <Button variant="secondary" onClick={galxe.continueInThisWindow}>Sign in on this page instead</Button>
        </StepActions>
      </>
    );
  }

  if (state.status === "checking") {
    return <StepText>Checking your Loyalty Points in both campaigns…</StepText>;
  }

  if (state.status === "idle") {
    return (
      <>
        <StepText>
          We check your Loyalty Points in the TINA campaigns on Galxe. We won't change your account or take any actions on your behalf.
        </StepText>
        {state.error && <Note tone="error">{state.error}</Note>}
        <StepActions>
          <Button onClick={galxe.signIn}>Sign in with Galxe</Button>
        </StepActions>
      </>
    );
  }

  const { session } = state;
  const signedInAs = `Signed in as Galxe ID ${shortId(session.galxeId)}`;
  const switchAccount = (
    <StepActions>
      <Button variant="secondary" onClick={() => { galxe.signOut(); galxe.signIn(); }}>
        Sign in with another account
      </Button>
    </StepActions>
  );

  if (closed && !session.claim) {
    return (
      <>
        <StepText done={session.eligible}>{signedInAs}.</StepText>
        {closedNote}
      </>
    );
  }

  if (!session.eligible && !session.claim) {
    return (
      <>
        <StepText>{signedInAs}</StepText>
        <Note>
          {session.hasLinkedAddress
            ? "This Galxe account didn't earn points in either TINA campaign, so it can't claim TINA. If you completed the quests with another Galxe account, sign in with that one."
            : "This Galxe account has no linked wallet, so no points could be found. Link the wallet you used for the quests on Galxe, then sign in again."}
        </Note>
        {switchAccount}
      </>
    );
  }

  const total = session.campaigns.reduce((sum, c) => sum + c.points, 0);

  return <StepText done>{signedInAs}. You’re eligible with {total.toLocaleString()} points.</StepText>;
}
