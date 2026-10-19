import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, createGalxeSession, type GalxeSession } from "@/lib/api";
import { shouldUsePopup, startPopupSignIn, startRedirectSignIn, takeOAuthCallback } from "@/lib/galxeOAuth";

const STORAGE_KEY = "tina_galxe_session";
// 서버 세션은 30분. 여유를 두고 조금 일찍 만료로 본다.
const CLIENT_TTL_MS = 28 * 60 * 1000;

type Stored = GalxeSession & { savedAt: number };

export type GalxeState =
  | { status: "idle"; error?: string }
  | { status: "waiting" }
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

  const popupRef = useRef<{ focus: () => void; cancel: () => void } | null>(null);

  const exchange = useCallback((code: string) => {
    setState({ status: "checking" });
    createGalxeSession(code)
      .then((session) => {
        save(session);
        setState({ status: "ready", session });
      })
      .catch((err: unknown) => {
        setState({ status: "idle", error: err instanceof ApiError ? err.message : "Galxe sign-in failed. Sign in again." });
      });
  }, []);

  // 페이지 이동 방식으로 Galxe 에서 돌아온 경우
  useEffect(() => {
    const callback = takeOAuthCallback();
    if (!callback) return;
    if ("error" in callback) setState({ status: "idle", error: callback.error });
    else exchange(callback.code);
  }, [exchange]);

  /** 데스크톱은 팝업, 모바일이거나 팝업이 막히면 페이지 이동. 클릭 핸들러에서 바로 불러야 팝업이 막히지 않는다. */
  const signIn = useCallback(() => {
    if (shouldUsePopup()) {
      const popup = startPopupSignIn((result) => {
        popupRef.current = null;
        if ("code" in result) exchange(result.code);
        else setState({ status: "idle", error: result.error === "denied" ? "Galxe sign-in was cancelled." : undefined });
      });
      if (popup) {
        popupRef.current = popup;
        setState({ status: "waiting" });
        return;
      }
    }
    startRedirectSignIn();
  }, [exchange]);

  const showPopup = useCallback(() => popupRef.current?.focus(), []);

  /** 팝업 대신 이 창에서 Galxe 로 이동한다 (팝업을 못 찾거나 쓰기 불편할 때). */
  const continueInThisWindow = useCallback(() => {
    popupRef.current?.cancel();
    popupRef.current = null;
    startRedirectSignIn();
  }, []);

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

  return { state, signIn, showPopup, continueInThisWindow, signOut, markClaimed };
}
