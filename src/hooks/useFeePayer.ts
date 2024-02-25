import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import env from '../libs/env';
import { useEffect, useState } from 'preact/hooks';

export const useFeePayer = () => {
  const [feePayerPubKey, setFeePayerPubKey] = useState<PublicKey | null>(null);
  useEffect(() => {
    const fetchFeePayerPubKey = async () => {
      const feePayer = await fetch(env.FEE_PAYER_URL, {
        method: 'GET',
        headers: new Headers({
          Accept: 'application/vnd.github.cloak-preview',
        }),
      }).then((res) => res.text());
      setFeePayerPubKey(new PublicKey(feePayer));
    };
    fetchFeePayerPubKey();
  }, []);

  const sendTxThroughGoApi = async (
    connection: Connection,
    instructions: TransactionInstruction[],
    signTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined,
  ) => {
    if (!signTransaction) {
      throw new Error('No sign transaction function provided.');
    }
    if (!feePayerPubKey) {
      throw new Error('Fee payer public key not available.');
    }

    const blockhash = (await connection.getLatestBlockhash('max')).blockhash;

    const tx = new Transaction();
    tx.add(...instructions);
    tx.feePayer = new PublicKey(feePayerPubKey);
    tx.recentBlockhash = blockhash;
    const signedTx = await signTransaction(tx);

    const response = await fetch(env.FEE_PAYER_URL, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
      body: JSON.stringify([signedTx
        .serialize({
          requireAllSignatures: false,
        })
        .toString('hex')]),
    })
      .then((res) => {
        if (!res.ok) {
          throw Error('Unable to sign request on the backend');
        }
        return res;
      })
      .then((res) => res.text());
    if (!response) {
      throw new Error('Failed to sign transaction on backend');
    }

    return response.toString();
  };

  return {
    feePayerPubKey,
    sendTxThroughGoApi,
  };
};
