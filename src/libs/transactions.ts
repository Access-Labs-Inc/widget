import { SendTransactionOptions } from '@solana/wallet-adapter-base';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js';

export const sendTx = async (
  connection: Connection,
  feePayer: PublicKey,
  instructions: TransactionInstruction[],
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    options?: SendTransactionOptions,
  ) => Promise<string>,
  options?: SendTransactionOptions,
) => {
  const latestBlockHash = await connection.getLatestBlockhash();

  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = latestBlockHash.blockhash;
  tx.feePayer = feePayer;

  const signature = await sendTransaction(tx, connection, options);
  console.log('Signature: ', signature);
};
