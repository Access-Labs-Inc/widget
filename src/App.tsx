import { h } from "preact";
import { useMemo } from "preact/hooks";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { ConnectionProvider } from "./components/wallet-adapter/ConnectionProvider";
import { WalletProvider } from "./components/wallet-adapter/WalletProvider";
import { WalletModalProvider } from "./components/wallet-adapter/ui/WalletModalProvider";

import { Configurations } from "./models";
import Main from "./layout/Main";
import { AppContext } from "./AppContext";

type Props = Configurations;
export const App = ({ element, ...appSettings }: Props) => {
  const network = WalletAdapterNetwork.Devnet;
  console.log("Connected to network: ", network);

  const endpoint = "https://api.devnet.solana.com";

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter({ params: { network } }),
    ],
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
