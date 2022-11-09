import { h } from "preact";
import { Web3Auth } from "@web3auth/modal";
import { ComponentChildren, createContext, FunctionComponent } from "preact";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import { getWalletProvider, IWalletProvider } from "./walletProvider";
import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  ADAPTER_EVENTS,
  SafeEventEmitterProvider,
} from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { PublicKey, Transaction } from "@solana/web3.js";

export interface IWeb3AuthContext {
  web3Auth: Web3Auth | null;
  provider: IWalletProvider | null;
  isLoading: boolean;
  user: unknown;
  chain: string;
  publicKey: PublicKey | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  signMessage: ((message: string) => Promise<void>) | null;
  sendTransaction: ((transaction: Transaction) => Promise<void>) | null;
}

export const Web3AuthContext = createContext<IWeb3AuthContext>({
  web3Auth: null,
  provider: null,
  isLoading: false,
  user: null,
  chain: "",
  publicKey: null,
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => {},
  getAccounts: async () => {},
  getBalance: async () => {},
  signMessage: null,
  sendTransaction: null,
});

export function useWeb3Auth(): IWeb3AuthContext {
  return useContext(Web3AuthContext);
}

const WEB3AUTH_NETWORK = {
  mainnet: {
    displayName: "Mainnet",
  },
  testnet: {
    displayName: "Testnet",
  },
  cyan: {
    displayName: "Cyan",
  },
} as const;
type WEB3AUTH_NETWORK_TYPE = keyof typeof WEB3AUTH_NETWORK;

export const CHAIN_CONFIG = {
  solanaMainnet: {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    rpcTarget: "https://api.mainnet-beta.solana.com",
    blockExplorer: "https://explorer.solana.com/",
    chainId: "0x1",
    displayName: "Solana Mainnet",
    ticker: "SOL",
    tickerName: "Solana",
  } as CustomChainConfig,
  solanaDevnet: {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    rpcTarget: "https://api.devnet.solana.com",
    blockExplorer: "https://explorer.solana.com/",
    chainId: "0x3",
    displayName: "Solana Devnet",
    ticker: "SOL",
    tickerName: "Solana",
  } as CustomChainConfig,
} as const;

export type CHAIN_CONFIG_TYPE = keyof typeof CHAIN_CONFIG;

interface IWeb3AuthState {
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
  clientId: string;
}
interface IWeb3AuthProps {
  children?: ComponentChildren;
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
  clientId: string;
}

export const Web3AuthProvider: FunctionComponent<IWeb3AuthState> = ({
  children,
  web3AuthNetwork,
  chain,
  clientId,
}: IWeb3AuthProps) => {
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IWalletProvider | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!provider) return;
      const accounts = await provider.getAccounts();
      setPublicKey(new PublicKey(accounts[0]));
    })();
  }, [provider]);

  const setWalletProvider = useCallback(
    (web3authProvider: SafeEventEmitterProvider) => {
      const walletProvider = getWalletProvider(chain, web3authProvider);
      setProvider(walletProvider);
    },
    [chain]
  );

  useEffect(() => {
    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      // Can subscribe to all ADAPTER_EVENTS and LOGIN_MODAL_EVENTS
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data: unknown) => {
        console.log("Yeah!, you are successfully logged in", data);
        setUser(data);
        setWalletProvider(web3auth.provider!);
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        setUser(null);
      });

      web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
        console.error("some error or user has cancelled login request", error);
      });
    };

    const currentChainConfig = CHAIN_CONFIG[chain];

    async function init() {
      try {
        setIsLoading(true);
        const web3AuthInstance = new Web3Auth({
          chainConfig: currentChainConfig,
          // get your client id from https://dashboard.web3auth.io
          clientId,
        });
        const adapter = new OpenloginAdapter({
          adapterSettings: { network: web3AuthNetwork, clientId },
        });
        web3AuthInstance.configureAdapter(adapter);
        subscribeAuthEvents(web3AuthInstance);
        setWeb3Auth(web3AuthInstance);
        await web3AuthInstance.initModal();
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [chain, web3AuthNetwork, setWalletProvider]);

  const login = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    const localProvider = await web3Auth.connect();
    setWalletProvider(localProvider!);
  };

  const logout = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    await web3Auth.logout();
    setProvider(null);
    setPublicKey(null);
  };

  const getUserInfo = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    return await web3Auth.getUserInfo();
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    await provider.getAccounts();
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    await provider.getBalance();
  };

  const signMessage = async (message: string) => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    await provider.signMessage(message);
  };

  const sendTransaction = async (transaction: Transaction) => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    await provider.sendTransaction(transaction);
  };

  const contextProvider = {
    web3Auth,
    chain,
    provider,
    publicKey,
    user,
    isLoading,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    sendTransaction,
  };

  return (
    <Web3AuthContext.Provider value={contextProvider}>
      {children}
    </Web3AuthContext.Provider>
  );
};
