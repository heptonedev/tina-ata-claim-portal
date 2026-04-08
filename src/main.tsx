import "./polyfills";

async function bootstrap() {
  const { StrictMode } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { default: Providers } = await import("./providers");
  const { default: App } = await import("./App");
  await import("@solana/wallet-adapter-react-ui/styles.css");
  await import("./globals.css");

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
}

bootstrap();
