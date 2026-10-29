import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// 지갑 선택창 CSS 첫 줄의 Google Fonts(DM Sans) @import 를 뺀다. 글꼴은 globals.css 에서 Pretendard 로 덮어써 쓰지 않고,
// 외부 요청이 막히면 CSS 로딩 실패로 앱 전체가 뜨지 않는다.
const stripWalletFontImport: Plugin = {
  name: "strip-wallet-font-import",
  enforce: "pre",
  transform(code, id) {
    if (!id.includes("wallet-adapter-react-ui/styles.css")) return null;
    return code.replace(/@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com[^)]*\)\s*;?/g, "");
  },
};

export default defineConfig({
  plugins: [stripWalletFontImport, react()],
  server: {
    headers: {
      "Content-Security-Policy": "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    esbuild: {
      define: {
        global: "globalThis",
      },
    },
  },
  define: {
    global: "globalThis",
  },
});
