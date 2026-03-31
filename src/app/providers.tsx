"use client";

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

const RPC_ENDPOINT = "https://solana-mainnet.g.allthatnode.com/full/json_rpc/a27dfe38723a4a2c9852ece82e92f2ed";

export default function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => RPC_ENDPOINT, []);
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
