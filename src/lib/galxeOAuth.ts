import { GALXE_CLIENT_ID, GALXE_OAUTH_URL, GALXE_REDIRECT_URI, GALXE_SCOPES } from "./config";

const STATE_KEY = "galxe_oauth_state";

export function startGalxeSignIn() {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: GALXE_CLIENT_ID,
    scope: GALXE_SCOPES,
    redirect_uri: GALXE_REDIRECT_URI,
    state,
  });
  window.location.href = `${GALXE_OAUTH_URL}?${params.toString()}`;
}

/** Galxe 에서 돌아온 경우 code 를 꺼내고 URL 을 정리한다. state 가 맞지 않으면 error. */
export function takeOAuthCallback(): { code: string } | { error: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return null;

  const state = params.get("state");
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  window.history.replaceState({}, "", window.location.pathname);

  if (!state || state !== saved) return { error: "Galxe sign-in couldn't be verified. Sign in again." };
  return { code };
}
