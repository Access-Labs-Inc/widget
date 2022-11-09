import { Transaction } from "@solana/web3.js";
import { SafeEventEmitterProvider } from "@web3auth/base";
import solanaProvider from "./solanaProvider";

export interface IWalletProvider {
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  sendTransaction: (transaction: Transaction) => Promise<void> | null;
  signMessage: (message: string) => Promise<void> | null;
}

export const getWalletProvider = (
  _chain: string,
  provider: SafeEventEmitterProvider
): IWalletProvider => {
  return solanaProvider(provider);
};
