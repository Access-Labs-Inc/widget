import { SendTransactionOptions } from '@solana/wallet-adapter-base';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Transaction,
  ConfirmOptions,
} from '@solana/web3.js';

export const sendTx = async (
  connection: Connection,
  feePayer: PublicKey,
  instructions: TransactionInstruction[],
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    sendOptions?: SendTransactionOptions
  ) => Promise<string>,
  sendOptions?: SendTransactionOptions,
  options?: ConfirmOptions
) => {
  const latestBlockHash = await connection.getLatestBlockhash();

  const transaction = new Transaction({ ...latestBlockHash }).add(
    ...instructions
  );
  transaction.feePayer = feePayer;

  const signature = await sendTransaction(transaction, connection, sendOptions);

  // TODO: Return back after this resolves: https://github.com/solana-labs/solana/pull/28290
  // const status =
  //   transaction.recentBlockhash != null &&
  //   transaction.lastValidBlockHeight != null
  //     ? (
  //         await connection.confirmTransaction(
  //           {
  //             signature: signature,
  //             ...latestBlockHash,
  //           },
  //           options && options.commitment
  //         )
  //       ).value
  //     : (
  //         await connection.confirmTransaction(
  //           signature,
  //           options && options.commitment
  //         )
  //       ).value;

  // if (status.err) {
  //   throw new Error(
  //     `Transaction ${signature} failed (${JSON.stringify(status)})`
  //   );
  // }

  console.log('Signature: ', signature);
  return signature;
};
