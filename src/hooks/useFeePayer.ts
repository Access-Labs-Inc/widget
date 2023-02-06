import { SendTransactionOptions } from "@solana/wallet-adapter-base";
import { Connection, Transaction, TransactionSignature } from "@solana/web3.js";
import env from "../libs/env";

export const useFeePayer = async (props: {
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>;
}) => {
  const sendTransaction = async (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => {
    const response = await fetch(env.FEE_PAYER_URL, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "text/plain",
      }),
      body: transaction
        .serialize({
          requireAllSignatures: false,
        })
        .toString("hex"),
    })
      .then((res) => {
        if (!res.ok) {
          throw Error("Unable to sign request on the backend");
        }
        return res;
      })
      .then((res) => res.text());
    if (!response) {
      throw new Error("Failed to sign transaction on backend");
    }

    const tx = Transaction.from(Buffer.from(response, "base64"));
    return tx.compileMessage().header.numRequiredSignatures === 1
      ? connection.sendRawTransaction(tx.serialize(), options)
      : props.sendTransaction(tx, connection, options);
  };

  const feePayerPubKey = await fetch(env.FEE_PAYER_URL, {
    method: "GET",
    headers: new Headers({
      Accept: "application/vnd.github.cloak-preview",
    }),
  }).then((res) => res.text());

  return {
    feePayerPubKey,
    sendTransaction,
  };
};
