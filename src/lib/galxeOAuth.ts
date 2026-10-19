import { GALXE_CLIENT_ID, GALXE_OAUTH_URL, GALXE_REDIRECT_URI, GALXE_SCOPES } from "./config";

const STATE_KEY = "galxe_oauth_state";
const CHANNEL = "tina-galxe-oauth";
// 팝업에서 돌아왔는지는 state 로 구분한다. Chrome 은 다른 사이트로 이동할 때 window.name 을 지운다.
const POPUP_STATE_PREFIX = "popup-";

type CallbackMessage = { type: "galxe-oauth"; state: string; code: string | null; error: string | null };
export type PopupResult = { code: string } | { error: "closed" | "denied" };

function authUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GALXE_CLIENT_ID,
    scope: GALXE_SCOPES,
    redirect_uri: GALXE_REDIRECT_URI,
    state,
  });
  return `${GALXE_OAUTH_URL}?${params.toString()}`;
}

/** 지갑 앱 안의 브라우저·모바일 브라우저는 팝업을 막거나 새 탭으로 열어서 페이지 이동 방식을 쓴다. */
export function shouldUsePopup(): boolean {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const touchOnly = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return !mobile && !touchOnly;
}

export function startRedirectSignIn() {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  window.location.href = authUrl(state);
}

/**
 * Galxe 로그인을 팝업으로 연다. 팝업이 막히면 null 을 돌려주므로 페이지 이동으로 대신한다.
 * 클릭 이벤트 안에서 바로 호출해야 브라우저가 팝업을 막지 않는다.
 */
export function startPopupSignIn(onResult: (result: PopupResult) => void): { focus: () => void; cancel: () => void } | null {
  const state = POPUP_STATE_PREFIX + crypto.randomUUID();
  const width = 480;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  const popup = window.open(authUrl(state), "galxe-login", `popup=yes,width=${width},height=${height},left=${left},top=${top}`);
  if (!popup) return null;

  let done = false;
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
  } catch {
    // 지원하지 않는 브라우저는 window.opener 경로만 쓴다
  }

  const finish = (result: PopupResult) => {
    if (done) return;
    done = true;
    window.removeEventListener("message", onWindowMessage);
    channel?.close();
    clearInterval(watcher);
    onResult(result);
  };

  const handle = (data: unknown) => {
    const msg = data as Partial<CallbackMessage> | null;
    if (msg?.type !== "galxe-oauth" || msg.state !== state) return;
    try {
      popup.close();
    } catch {
      // 팝업이 스스로 닫힌다
    }
    finish(msg.code ? { code: msg.code } : { error: "denied" });
  };

  const onWindowMessage = (event: MessageEvent) => {
    if (event.origin === window.location.origin) handle(event.data);
  };
  window.addEventListener("message", onWindowMessage);
  if (channel) channel.onmessage = (event) => handle(event.data);

  // 결과 메시지보다 닫힘 감지가 먼저 처리되지 않도록 잠시 기다렸다가 닫힘으로 본다
  const watcher = window.setInterval(() => {
    if (popup.closed) window.setTimeout(() => finish({ error: "closed" }), 400);
  }, 500);

  return {
    focus: () => popup.focus(),
    cancel: () => {
      try {
        popup.close();
      } catch {
        // 무시
      }
      finish({ error: "closed" });
    },
  };
}

/**
 * 팝업 안에서 Galxe 로부터 돌아온 경우 결과를 원래 창으로 넘기고 닫는다.
 * 팝업 콜백이었으면 true (이 창에서는 앱을 띄우지 않는다).
 */
export function handlePopupCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  const state = params.get("state");
  if (!state?.startsWith(POPUP_STATE_PREFIX) || (!params.get("code") && !params.get("error"))) return false;

  const message: CallbackMessage = { type: "galxe-oauth", state, code: params.get("code"), error: params.get("error") };
  window.history.replaceState({}, "", window.location.pathname);
  try {
    window.opener?.postMessage(message, window.location.origin);
  } catch {
    // opener 가 없으면 BroadcastChannel 로만 전달된다
  }
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // 무시
  }
  window.setTimeout(() => window.close(), 150);
  return true;
}

/** 페이지 이동 방식으로 Galxe 에서 돌아온 경우 code 를 꺼내고 URL 을 정리한다. */
export function takeOAuthCallback(): { code: string } | { error: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return null;

  const state = params.get("state");
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  window.history.replaceState({}, "", window.location.pathname);

  if (!code) return { error: "Galxe sign-in was cancelled." };
  if (!state || state !== saved) return { error: "Galxe sign-in couldn't be verified. Sign in again." };
  return { code };
}
