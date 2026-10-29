import "./polyfills";
import { handlePopupCallback } from "./lib/galxeOAuth";

async function bootstrap() {
  // Galxe 로그인 팝업으로 돌아온 창이면 결과만 원래 창에 넘기고 닫는다 (앱은 띄우지 않는다)
  if (handlePopupCallback()) {
    document.getElementById("root")!.innerHTML =
      '<p style="font-family:system-ui,sans-serif;color:#93A9C3;text-align:center;margin-top:40vh">Returning to TINA. You can close this window.</p>';
    return;
  }

  const { StrictMode } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { default: Providers } = await import("./providers");
  const { default: App } = await import("./App");
  // CSS 를 못 받아도 화면은 띄운다 (스타일이 빠질 뿐 신청은 할 수 있게)
  await Promise.all([
    import("@solana/wallet-adapter-react-ui/styles.css").catch((err) => console.error("wallet styles failed to load", err)),
    import("./globals.css").catch((err) => console.error("styles failed to load", err)),
  ]);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
}

bootstrap();
