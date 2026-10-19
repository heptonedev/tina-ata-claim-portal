import { useCallback, useEffect, useState } from "react";
import { ApiError, createGalxeSession, type GalxeSession } from "@/lib/api";
import { startGalxeSignIn, takeOAuthCallback } from "@/lib/galxeOAuth";

const STORAGE_KEY = "tina_galxe_session";
// 서버 세션은 30분. 여유를 두고 조금 일찍 만료로 본다.
const CLIENT_TTL_MS = 28 * 60 * 1000;

type Stored = GalxeSession & { savedAt: number };

export type GalxeState =
  | { status: "idle"; error?: string }
  | { status: "checking" }
  | { status: "ready"; session: GalxeSession };

function load(): GalxeSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (Date.now() - stored.savedAt > CLIENT_TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

function save(session: GalxeSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, savedAt: Date.now() }));
  } catch {
    // 저장이 안 돼도 이번 화면에서는 계속 진행할 수 있다
  }
}

export function useGalxeSession() {
  const [state, setState] = useState<GalxeState>(() => {
    const session = load();
    return session ? { status: "ready", session } : { status: "idle" };
  });

  useEffect(() => {
    const callback = takeOAuthCallback();
    if (!callback) return;
    if ("error" in callback) {
      setState({ status: "idle", error: callback.error });
      return;
    }

    setState({ status: "checking" });
    createGalxeSession(callback.code)
      .then((session) => {
        save(session);
        setState({ status: "ready", session });
      })
      .catch((err: unknown) => {
        setState({ status: "idle", error: err instanceof ApiError ? err.message : "Galxe sign-in failed. Sign in again." });
      });
  }, []);

  const signIn = useCallback(() => startGalxeSignIn(), []);

  const signOut = useCallback((error?: string) => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState({ status: "idle", error });
  }, []);

  const markClaimed = useCallback((walletAddress: string) => {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const session = { ...prev.session, claim: { walletAddress, status: "pending", requestedAt: new Date().toISOString() } };
      save(session);
      return { status: "ready", session };
    });
  }, []);

  return { state, signIn, signOut, markClaimed };
}
