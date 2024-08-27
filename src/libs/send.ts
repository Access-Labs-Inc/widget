import bs58 from 'bs58';
import { sleep } from '@accessprotocol/js';
import { PromisePool } from '@supercharge/promise-pool';
import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

export const confirmTxs = async (
  txs: Array<Transaction | VersionedTransaction>,
  connection: Connection,
  txStatus = 'confirmed',
) => {
  for (let i = 0; i < 150; i += 1) {
    // we're spamming at the beginning, this raises the probability of the tx being included in the block
    if (i > 30) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
    }
    let finished = true;
    for (const tx of txs) {
      if (!tx) { throw new Error('No transaction.'); }
      const sigBuffer =
        tx instanceof Transaction ? tx.signature : tx.signatures[0];
      if (!sigBuffer) { throw new Error('No transaction signature.'); }
      const sig = bs58.encode(sigBuffer);
      // eslint-disable-next-line no-await-in-loop
      const statuses = await connection.getSignatureStatuses([sig], {
        searchTransactionHistory: true,
      });
      if (!statuses || statuses.value.length === 0) {
        console.log('No statuses found.');
        finished = false;
        continue;
      }
      const status = statuses.value[0];
      const statusValue = status?.confirmationStatus;
      console.log('Confirmation status: ', statusValue);
      if (statusValue !== txStatus && statusValue !== 'finalized') {
        finished = false;
        console.log(`Resending tx: ${sig}`);
        if (txStatus === 'processed') {
          try {
            // eslint-disable-next-line no-await-in-loop
            await connection.sendRawTransaction(tx.serialize());
          } catch (err) {
            console.error(err);
            throw new Error(
              'REJECTED: We were unable to send transactions to Solana successfully. Please try again later.',
            );
          }
        }
      }
    }
    if (finished) { return; }
  }
  throw new Error(
    'We were unable to send transactions to Solana successfully. Please try again later.',
  );
};

const IX_BATCH_SIZE = 4;

async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
): Promise<number> {
  const testInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    ...instructions,
  ];

  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(),
  );

  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  console.log('SIM: ', simulation);
  if (simulation.value.err) {
    throw new Error(
      `Error simulating transaction: ${JSON.stringify(simulation.value.err)}`,
    );
  }
  return (simulation.value.unitsConsumed || 0) * 1.1;
}

async function getTransactionWithoutBlockhash(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  maxPriorityFeeLamports: number,
): Promise<VersionedTransaction> {
  const cus = await getSimulationUnits(connection, instructions, payer);

  const enhancedInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: cus }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.floor((maxPriorityFeeLamports / cus) * 1e6),
    }),
    ...instructions,
  ];

  return new VersionedTransaction(
    new TransactionMessage({
      instructions: enhancedInstructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(),
  );
}

export const sendTxDirectly = async (
  instructions: TransactionInstruction[],
  signAllTransactions:
    | ((txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>)
    | undefined,
  signTransaction:
    | ((tx: VersionedTransaction) => Promise<VersionedTransaction>)
    | undefined,
  connection: Connection,
  userPublicKey: PublicKey,
  maxPriorityFeeLamports: number,
  confirmationLevel: Commitment = 'confirmed',
): Promise<string[] | undefined> => {
  if (!signAllTransactions && !signTransaction) {
    throw new Error('No sign transaction function provided.');
  }

  const isHwWallet: boolean =
    localStorage.getItem('walletIsHWWallet') === 'true';

  const ixBatches = [];
  for (let i = 0; i < instructions.length; i += IX_BATCH_SIZE) {
    const ixsBatch = instructions.slice(i, i + IX_BATCH_SIZE);
    ixBatches.push(ixsBatch);
  }

  const preparedTxs = await PromisePool.withConcurrency(10)
    .for(ixBatches)
    .process(async (ixBatch) => {
      return getTransactionWithoutBlockhash(
        connection,
        ixBatch,
        userPublicKey,
        Math.floor(maxPriorityFeeLamports / ixBatches.length),
      );
    });

  if (preparedTxs.errors.length > 0) {
    console.error('Error preparing TXs: ', preparedTxs.errors);
    throw new Error(`Error preparing transactions, please report this issue.`);
  }

  // signing them all
  if (signAllTransactions && !isHwWallet) {
    if (preparedTxs.results.length > 0) {
      const {
        value: { blockhash },
        context,
      } = await connection.getLatestBlockhashAndContext(confirmationLevel);
      preparedTxs.results.forEach((tx) => {
        // eslint-disable-next-line no-param-reassign
        tx.message.recentBlockhash = blockhash;
      });
      const signedTxes = await signAllTransactions(preparedTxs.results);
      const ppSends = await PromisePool.withConcurrency(10)
        .for(signedTxes)
        .process(async (signedTx) => {
          let someSuccess = false;
          try {
            for (let i = 0; i < 30; i += 1) {
              await connection.sendRawTransaction(signedTx.serialize(), {
                maxRetries: 0,
                minContextSlot: context.slot,
                preflightCommitment: confirmationLevel,
                skipPreflight: true,
              });
              someSuccess = true;
            }
          } catch (err) {
            if (someSuccess) {
              console.log('Error in spamming: ', err);
            } else {
              console.error('Error sending TX: ', err);
              throw new Error('Unable to send transactions to Solana.');
            }
          }
          console.log('TX sent: ', signedTx);
          const sig = bs58.encode(signedTx.signatures[0]);
          return sig;
        });

      if (ppSends.errors.length > 0) {
        console.error('Error sending TXs: ', ppSends.errors);
      }

      console.log('TXs send: ', ppSends.results);
      if (ppSends.results.length > 0) {
        console.log('Confirming TXs....');
        await confirmTxs(signedTxes, connection, confirmationLevel);
      }

      return ppSends.results;
    }
    console.warn('No transactions to sign.');
    return undefined;
  }

  if (!signTransaction) {
    throw new Error('No sign transaction function provided.');
  }

  const signedTxs: VersionedTransaction[] = [];

  if (preparedTxs.results.length > 0) {
    const txs = preparedTxs.results;
    console.log('TXes to sing and send: ', txs);

    const signatures: string[] = [];
    for (const tx of txs) {
      const {
        value: { blockhash },
        context,
      } = await connection.getLatestBlockhashAndContext(confirmationLevel);
      tx.message.recentBlockhash = blockhash;
      const signedTx = await signTransaction(tx);
      signedTxs.push(signedTx);
      let someSuccess = false;
      try {
        for (let i = 0; i < 30; i += 1) {
          await connection.sendRawTransaction(signedTx.serialize(), {
            maxRetries: 0,
            minContextSlot: context.slot,
            preflightCommitment: confirmationLevel,
            skipPreflight: true,
          });
          someSuccess = true;
        }
      } catch (err) {
        if (someSuccess) {
          console.log('Error in spamming: ', err);
        } else {
          console.error('Error sending TX: ', err);
          throw new Error('Unable to send transactions to Solana.');
        }
      }

      const sig = bs58.encode(signedTx.signatures[0]);
      signatures.push(sig);
      console.log('Signature: ', sig);
    }

    await confirmTxs(signedTxs, connection, confirmationLevel);
    return signatures;
  }
  console.warn('No transactions to sign.');
  return undefined;
};
