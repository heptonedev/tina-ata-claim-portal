import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import { RPC_ENDPOINT } from "@/lib/config";

// Disconnect 후 autoConnect 방지
const wasDisconnected = sessionStorage.getItem("wallet_disconnected") === "1";
if (wasDisconnected) {
  sessionStorage.removeItem("wallet_disconnected");
}

export default function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => RPC_ENDPOINT, []);
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={!wasDisconnected}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
