import { h } from "preact";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { ConnectionProvider } from "./components/ConnectionProvider";

import { Configurations } from "./models";
import Main from "./layout/Main";
import { AppContext } from "./AppContext";
import { Web3AuthProvider } from "./components/web3auth/useWeb3Auth";

type Props = Configurations;
export const App = ({ element, ...appSettings }: Props) => {
  const network = WalletAdapterNetwork.Devnet;
  console.log("Connected to network: ", network);

  const endpoint = "https://api.devnet.solana.com";
  const web3AuthClientId =
    "BEo8QqCYdx-YliZjehx0As607shQunxkAt6UbQMXsbwWl9l5joiRC0rFidDG-sO6Qzu-GR1r38RbNWg561Nn1f8";

  return (
    <AppContext config={appSettings} element={element}>
      <ConnectionProvider endpoint={endpoint}>
        <Web3AuthProvider
          chain="solanaDevnet"
          web3AuthNetwork="testnet"
          clientId={web3AuthClientId}
        >
          <Main />
        </Web3AuthProvider>
      </ConnectionProvider>
    </AppContext>
  );
};
