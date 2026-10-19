import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ApiError, submitClaim } from "@/lib/api";
import { buildClaimMessage, readSessionNonce, toBase64 } from "@/lib/claimMessage";

export type ClaimPhase = "idle" | "signing" | "submitting";

export function useClaim(onClaimed: (wallet: string) => void, onSessionExpired: (message: string) => void) {
  const { publicKey, signMessage } = useWallet();
  const [phase, setPhase] = useState<ClaimPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(
    async (sessionToken: string) => {
      if (!publicKey) return;
      if (!signMessage) {
        setError("This wallet can't sign messages. Use Phantom or Solflare.");
        return;
      }
      setError(null);

      const wallet = publicKey.toBase58();
      const message = buildClaimMessage(wallet, readSessionNonce(sessionToken));

      setPhase("signing");
      let signature: string;
      try {
        signature = toBase64(await signMessage(new TextEncoder().encode(message)));
      } catch {
        setPhase("idle");
        setError("You cancelled the signature. Sign the message to claim.");
        return;
      }

      setPhase("submitting");
      try {
        await submitClaim({ sessionToken, walletAddress: wallet, message, signature });
        onClaimed(wallet);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && err.message.includes("Sign in again")) {
          onSessionExpired(err.message);
        } else {
          setError(err instanceof ApiError ? err.message : "The claim wasn't sent. Try again.");
        }
      } finally {
        setPhase("idle");
      }
    },
    [publicKey, signMessage, onClaimed, onSessionExpired],
  );

  return { claim, phase, error };
}
