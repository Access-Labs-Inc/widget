import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import env from '../libs/env';
import { useEffect, useState } from 'preact/hooks';
import { sleep } from '../libs/utils';

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
    userPublicKey: PublicKey,
  ) => {
    if (!signTransaction) {
      throw new Error('No sign transaction function provided.');
    }
    if (!feePayerPubKey) {
      throw new Error('Fee payer public key not available.');
    }

    const blockhash = (await connection.getLatestBlockhash('max')).blockhash;
    const isCoinbaseWallet = localStorage.getItem('walletName') === '"Coinbase Wallet"';

    const tx = new Transaction();
    tx.add(...instructions);
    tx.feePayer = new PublicKey(feePayerPubKey);
    if (isCoinbaseWallet) {
      tx.feePayer = userPublicKey;
    }
    tx.recentBlockhash = blockhash;
    const signedTx = await signTransaction(tx);
    if (isCoinbaseWallet) {
      return connection.sendRawTransaction(signedTx.serialize());
    }

    const response = await fetch(env.FEE_PAYER_URL, {
      method: 'POST',
      body: JSON.stringify([signedTx
        .serialize({
          requireAllSignatures: false,
        })
        .toString('hex')]),
    });

    if (!response.ok) {
      throw Error('Unable to sign request on the backend');
    }
    const json: string[] = await response.json();
    if (!json) {
      throw new Error('Failed to sign transaction on backend');
    }

    const sx = await connection.sendRawTransaction(Buffer.from(json[0], 'hex'));
    for (let i = 0; i < 12; i += 1) {
      if (!sx) {
        throw new Error('No transaction signature.');
      }
      // eslint-disable-next-line no-await-in-loop
      const status = await connection.getSignatureStatus(sx, {
        searchTransactionHistory: true,
      });
      const statusValue = status.value?.confirmationStatus;
      if (statusValue === 'confirmed' || statusValue === 'finalized') {
        return sx;
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(5000);
    }
    throw new Error('Unable to verify transactions on chain');
  };

  return {
    feePayerPubKey,
    sendTxThroughGoApi,
  };
};
