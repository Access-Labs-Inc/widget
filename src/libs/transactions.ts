import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";

export const sendTx = async (
  connection: Connection,
  feePayer: PublicKey,
  instructions: TransactionInstruction[],
  signAndSendTransaction: (transaction: Transaction) => Promise<void>
) => {
  const latestBlockHash = await connection.getLatestBlockhash();

  const transaction = new Transaction({ ...latestBlockHash }).add(
    ...instructions
  );
  transaction.feePayer = feePayer;

  await signAndSendTransaction(transaction);

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
};
