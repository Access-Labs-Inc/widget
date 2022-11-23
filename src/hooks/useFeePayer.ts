import { SendTransactionOptions } from '@solana/wallet-adapter-base';
import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';

export const useFeePayer = async (props: {
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined;
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions,
  ) => Promise<TransactionSignature>;
}) => {

  const sendTransaction = async (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions,
  ) => {
    const response = await fetch(
      'https://st-go-api.accessprotocol.co/pay-fees', // todo change to production
      {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'text/plain',
        }),
        body: transaction
          .serialize({
            requireAllSignatures: false,
          })
          .toString('hex'),
      }).then((res) => {
      if (!res.ok) {
        throw Error('Unable to sign request on the backend');
      }
      return res;
    }).then((res) => res.text());
    if (!response) {
      throw new Error('Failed to sign transaction on backend');
    }

    const tx = Transaction.from(Buffer.from(response, 'base64'));
    return tx.compileMessage().header.numRequiredSignatures === 1
      ? connection.sendRawTransaction(tx.serialize(), options)
      : props.sendTransaction(tx, connection, options);
  };

  const feePayerPubKey = await fetch(
    `https://st-go-api.accessprotocol.co/pay-fees`, // todo change to production
    {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/vnd.github.cloak-preview'
      })
    }
  ).then((res) => res.text());

  return {
    feePayerPubKey,
    sendTransaction,
  };
};
