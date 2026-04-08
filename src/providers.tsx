import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletConnectWalletAdapter } from "@walletconnect/solana-adapter";

const RPC_ENDPOINT = "https://solana-mainnet.g.allthatnode.com/full/json_rpc/a27dfe38723a4a2c9852ece82e92f2ed";

const WALLETCONNECT_PROJECT_ID = "85caec5de0ac812440ae1c91753b192a";

export default function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => RPC_ENDPOINT, []);
  const wallets = useMemo(() => [
    new WalletConnectWalletAdapter({
      network: "mainnet-beta" as any,
      options: {
        projectId: WALLETCONNECT_PROJECT_ID,
      },
    }),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
