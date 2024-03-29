import { h } from "preact";
import { useMemo } from "preact/hooks";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { ConnectionProvider } from "./components/wallet-adapter/ConnectionProvider";
import { WalletProvider } from "./components/wallet-adapter/WalletProvider";
import { WalletModalProvider } from "./components/wallet-adapter/ui/WalletModalProvider";

import { Configurations } from "./models";
import Main from "./layout/Main";
import { AppContext } from "./AppContext";
import env from "./libs/env";

type Props = Configurations;
export const App = ({ element, ...appSettings }: Props) => {
  const network = env.SOLANA_NETWORK as WalletAdapterNetwork;
  console.log("Connected to network: ", network);

  const endpoint = env.SOLANA_RPC_URL;

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );
  return (
    <AppContext config={appSettings} element={element}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Main />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AppContext>
  );
};
