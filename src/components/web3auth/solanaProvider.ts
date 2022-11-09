import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { SolanaWallet } from "@web3auth/solana-provider";
import { IWalletProvider } from "./walletProvider";

const solanaProvider = (
  provider: SafeEventEmitterProvider
): IWalletProvider => {
  const solanaWallet = new SolanaWallet(provider);

  const getConnection = async (): Promise<Connection> => {
    const connectionConfig = await solanaWallet.request<CustomChainConfig>({
      method: "solana_provider_config",
      params: [],
    });
    return new Connection(connectionConfig.rpcTarget);
  };

  const getAccounts = async (): Promise<string[]> => {
    return await solanaWallet.requestAccounts();
  };

  const getBalance = async () => {
    const conn = await getConnection();
    const accounts = await solanaWallet.requestAccounts();
    return await conn.getBalance(new PublicKey(accounts[0]));
  };

  const signMessage = async (message: string): Promise<Uint8Array> => {
    const msg = Buffer.from(message, "utf8");
    return await solanaWallet.signMessage(msg);
  };

  const sendTransaction = async (
    transaction: Transaction
  ): Promise<{ signature: string }> => {
    const solWeb3 = new SolanaWallet(provider);
    return await solWeb3.signAndSendTransaction(transaction);
  };

  return {
    getAccounts,
    getBalance,
    signMessage,
    sendTransaction,
  };
};

export default solanaProvider;
