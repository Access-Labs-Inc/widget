import tw, { css } from 'twin.macro';
import { Fragment, h } from 'preact';
import BN from 'bn.js';
import { Info } from 'phosphor-react';
import { CentralState, StakeAccount, StakePool } from '../libs/ap/state';
import { claimRewards, createStakeAccount, stake } from '../libs/ap/bindings';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { ConfigContext } from '../AppContext';
import { useConnection } from '../components/wallet-adapter/useConnection';
import { useWallet } from '../components/wallet-adapter/useWallet';
import {
  ACCESS_PROGRAM_ID,
  getStakeAccounts,
  getUserACSBalance,
} from '../libs/program';
import { Tooltip } from '../components/Tooltip';
import { NumberInputWithSlider } from '../components/NumberInputWithSlider';
import { sendTx } from '../libs/transactions';
import Loading from '../components/Loading';
import { ProgressStep } from '../components/ProgressStep';
import { formatACSCurrency } from '../libs/utils';
import { useFeePayer } from '../hooks/useFeePayer';
import { WalletAdapterProps } from '@solana/wallet-adapter-base';

const styles = {
  root: tw`h-[31em] flex flex-col justify-between`,
  cancel_link: tw`self-end cursor-pointer text-blue-400 no-underline`,
  button: tw`w-full rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-stone-700 border-0`,
  title: tw`my-8 mt-16 text-white text-2xl text-center`,
  titleError: tw`mt-8 text-red-500 text-2xl text-center`,
  subtitle: tw`text-white text-center text-stone-400`,
  subtitleError: tw`text-red-500 text-center`,
  feesRoot: tw`mt-2 text-center text-xs text-stone-400`,
  feeWithTooltip: tw`flex justify-center`,
  loader: tw`flex justify-center content-center mb-56`,
  steps: tw`flex flex-col justify-start my-4`,
  stepsList: tw`space-y-4 list-none mb-10`,
  disabledButtonStyles: tw`bg-stone-600 cursor-not-allowed`,
  invalid: tw`bg-red-400`,
  invalidText: tw`mt-1 text-center text-red-500`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-300 text-stone-800`}
  }
`;

interface FeePaymentData {
  feePayerPubKey: string;
  sendTransaction: WalletAdapterProps['sendTransaction'];
}

export const Stake = () => {
  const { poolId, poolName } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, sendTransaction: sendTransactionWithFeesUnpaid, signMessage } = useWallet();

  const [feePaymentState, setFeePayer] =
    useState<FeePaymentData | undefined>();

  useEffect(() => {
    (async () => {
       const {feePayerPubKey: pubkey, sendTransaction} = await useFeePayer({
          sendTransaction: sendTransactionWithFeesUnpaid,
          signMessage,
        });
       setFeePayer({feePayerPubKey: pubkey, sendTransaction});
      })();
  }, [publicKey]);

  const [working, setWorking] = useState('idle');
  const [balance, setBalance] = useState<BN | null | undefined>(undefined);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [stakedAccount, setStakedAccount] = useState<
    StakeAccount | undefined | null
  >(undefined);
  const [stakedPool, setStakedPool] = useState<StakePool | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(0);
  const [stakeModalOpen, setStakeModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openStakeModal = () => setStakeModal(true);

  const feePercentage = 2;
  const feePercentageFraction = feePercentage / 100;

  useEffect(() => {
    if (!publicKey || !connection) {
      return;
    }
    (async () => {
      const b = await connection.getBalance(publicKey);
      setSolBalance(b / 10 ** 9);
    })();
  }, [publicKey, connection]);

  useEffect(() => {
    if (!publicKey || !connection) {
      return;
    }
    (async () => {
      const b = await getUserACSBalance(connection, publicKey);
      setBalance(b);
      setStakeAmount(
        b != null ? b.toNumber() / (1 + feePercentageFraction) : 0
      );
    })();
  }, [publicKey, connection, getUserACSBalance]);

  useEffect(() => {
    if (!publicKey || !poolId || !connection) {
      return;
    }
    (async () => {
      const stakedAccounts = await getStakeAccounts(connection, publicKey);
      if (stakedAccounts != null && stakedAccounts.length > 0) {
        const sAccount = stakedAccounts.find((st) => {
          const sa = StakeAccount.deserialize(st.account.data);
          return sa.stakePool.toBase58() === poolId;
        });
        if (sAccount) {
          const sa = StakeAccount.deserialize(sAccount.account.data);
          setStakedAccount(sa);
        } else {
          setStakedAccount(null);
        }
        return;
      }
      setStakedAccount(null);
    })();
  }, [publicKey, connection, poolId]);

  useEffect(() => {
    if (!poolId) {
      return;
    }
    (async () => {
      const sp = await StakePool.retrieve(connection, new PublicKey(poolId));
      setStakedPool(sp);
    })();
  }, [poolId]);

  const fee = useMemo(() => {
    return Number(stakeAmount) * feePercentageFraction;
  }, [stakeAmount, feePercentage]);

  const handle = async () => {
    let feePayer = publicKey;
    let sendTransaction = sendTransactionWithFeesUnpaid;
    if (insufficientSolBalance && publicKey != null && feePaymentState != null) {
      feePayer = new PublicKey(feePaymentState.feePayerPubKey);
      sendTransaction = feePaymentState.sendTransaction;
    }

    if (
      !publicKey ||
      !poolId ||
      !connection ||
      !feePayer ||
      !sendTransaction ||
      !balance ||
      !signMessage ||
      !stakedPool
    ) {
      return;
    }

    try {
      openStakeModal();

      const [centralKey] = await CentralState.getKey(ACCESS_PROGRAM_ID);
      const centralState = await CentralState.retrieve(connection, centralKey);
      const txs = [];

      // Check if stake account exists
      const [stakeKey] = await StakeAccount.getKey(
        ACCESS_PROGRAM_ID,
        publicKey,
        new PublicKey(poolId)
      );

      let stakeAccount;
      try {
        stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
      } catch {
        setWorking('account');
        const ixAccount = await createStakeAccount(
          new PublicKey(poolId),
          publicKey,
          feePayer,
          ACCESS_PROGRAM_ID
        );
        await sendTx(connection, feePayer, [ixAccount], sendTransaction, {
          skipPreflight: true,
        });
        stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
      }

      // Check if stake ata account exists
      const stakerAta = await getAssociatedTokenAddress(
        centralState.tokenMint,
        publicKey,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const stakerAtaAccount = await connection.getAccountInfo(stakerAta);
      if (stakerAtaAccount == null) {
        const ataix = createAssociatedTokenAccountInstruction(
          feePayer,
          stakerAta,
          publicKey,
          centralState.tokenMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        txs.push(ataix);
      }

      if (
        stakeAccount.stakeAmount.toNumber() > 0 &&
        stakeAccount.lastClaimedTime < stakedPool.lastCrankTime
      ) {
        setWorking('claim');
        const ix = await claimRewards(
          connection,
          stakeKey,
          stakerAta,
          ACCESS_PROGRAM_ID,
          true
        );

        await sendTx(connection, feePayer, [ix], sendTransaction, {
          skipPreflight: true,
        });
      }

      setWorking('stake');
      const ixStake = await stake(
        connection,
        stakeKey,
        stakerAta,
        stakeAmount,
        ACCESS_PROGRAM_ID
      );
      txs.push(ixStake);

      await sendTx(connection, feePayer, txs, sendTransaction, {
        skipPreflight: true,
      });

      setWorking('done');
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      }
    } finally {
      setWorking('done');
    }
  };

  const minPoolStakeAmount = useMemo(() => {
    return stakedPool?.minimumStakeAmount.toNumber() || 0;
  }, [stakedPool?.minimumStakeAmount]);

  const minStakeAmount = useMemo(() => {
    return Math.max(
      minPoolStakeAmount - Number(stakedAccount?.stakeAmount ?? 0),
      10 ** 6
    );
  }, [stakedAccount?.stakeAmount, minPoolStakeAmount]);

  const maxStakeAmount = useMemo(() => {
    return Number(balance) / (1 + feePercentageFraction);
  }, [balance, feePercentageFraction]);

  const insufficientBalance = useMemo(() => {
    return (
      minStakeAmount + minStakeAmount * feePercentageFraction >
      (balance?.toNumber() ?? 0)
    );
  }, [balance, minStakeAmount, feePercentageFraction]);

  const insufficientSolBalance = useMemo(
    () => solBalance === 0,
    [solBalance]
  );

  const invalidText = useMemo(() => {
    if (insufficientBalance) {
      return `Insufficient balance for staking. You need min. of ${minStakeAmount} ACS + ${
        minStakeAmount * feePercentageFraction
      } Protocol Fee.`;
    }
    return null;
  }, [
    insufficientBalance,
    minStakeAmount,
    feePercentageFraction,
    stakedAccount?.stakeAmount,
  ]);

  return (
    <div css={styles.root}>
      {stakeModalOpen && error && (
        <Fragment>
          <div css={styles.titleError}>Error occured:</div>
          <div css={styles.subtitleError}>{error}</div>
          <RouteLink css={[styles.button, hoverButtonStyles]} href='/'>
            Close
          </RouteLink>
        </Fragment>
      )}
      {stakeModalOpen && !error && (
        <Fragment>
          <div css={styles.title}>Steps to complete</div>
          <div css={styles.subtitle}>
            We need you to sign these
            <br /> transactions to stake
          </div>
          <nav css={styles.steps} aria-label='Progress'>
            <ol css={styles.stepsList}>
              <ProgressStep
                name='Create staking account'
                status={working === 'account' ? 'current' : 'complete'}
              />
              <ProgressStep
                name='Claim rewards'
                status={
                  working === 'claim'
                    ? 'current'
                    : working === 'account'
                    ? 'pending'
                    : 'complete'
                }
              />
              <ProgressStep
                name='Stake'
                status={
                  working === 'stake'
                    ? 'current'
                    : working === 'claim' ||
                      working === 'account' ||
                      working === 'idle'
                    ? 'pending'
                    : 'complete'
                }
              />
            </ol>
            <RouteLink
              disabled={working !== 'done'}
              href='/'
              css={[
                styles.button,
                working !== 'done'
                  ? styles.disabledButtonStyles
                  : hoverButtonStyles,
              ]}
            >
              Close
            </RouteLink>
          </nav>
        </Fragment>
      )}
      {!stakeModalOpen && (
        <Fragment>
          <Header>
            <RouteLink href='/' css={styles.cancel_link}>
              Cancel
            </RouteLink>
          </Header>

          {stakedAccount !== undefined && balance !== undefined && (
            <Fragment>
              <div css={styles.title}>Stake on &apos;{poolName}&apos;</div>
              {!insufficientBalance ? (
                <div css={styles.subtitle}>
                  Both {poolName} and you will receive a ACS inflation rewards
                  split equally.
                </div>
              ) : (
                <p css={styles.invalidText}>{invalidText}</p>
              )}

              <div>
                {!insufficientBalance && (
                  <NumberInputWithSlider
                    min={minStakeAmount}
                    max={maxStakeAmount}
                    value={stakeAmount}
                    disabled={insufficientBalance}
                    invalid={insufficientBalance}
                    invalidText={invalidText}
                    onChangeOfValue={(value) => {
                      setStakeAmount(value);
                    }}
                  />
                )}

                {(insufficientBalance) && (
                  <a
                    href='https://st-app.accessprotocol.co/get-acs'
                    target='_blank'
                    rel='noopener'
                    css={[styles.button, styles.invalid]}
                  >
                    Get ACS/SOL on access
                  </a>
                )}
                {!insufficientBalance && (
                  <button
                    css={[styles.button, hoverButtonStyles]}
                    onClick={handle}
                  >
                    Stake
                  </button>
                )}

                <div css={styles.feesRoot}>
                  <div css={styles.feeWithTooltip}>
                    <div>Protocol fee: {formatACSCurrency(fee)} ACS</div>
                    <Tooltip
                      message={`A ${feePercentage}% is fee deducted from your staked amount and is burned by the protocol.`}
                    >
                      <Info size={16} />
                    </Tooltip>
                  </div>
                  <div>Transaction fee: 0.000005 SOL ~ $0.00024</div>
                </div>
              </div>
            </Fragment>
          )}
          {stakedAccount === undefined &&
            stakedPool == null &&
            balance === undefined && (
              <div css={styles.loader}>
                <Loading />
              </div>
            )}
        </Fragment>
      )}
    </div>
  );
};
