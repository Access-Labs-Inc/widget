import tw, { css } from 'twin.macro';
import { Fragment, h } from 'preact';
import BN from 'bn.js';
import { Info } from 'phosphor-react';
import {
  CentralState,
  claimRewards,
  createStakeAccount,
  stake,
  StakeAccount,
  StakePool,
} from '../../access-protocol/smart-contract/js/src';
import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'preact/hooks';
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
import { PublicKey } from '@solana/web3.js';
import { sendTx } from '../libs/transactions';
import Loading from '../components/Loading';
import { ProgressStep } from '../components/ProgressStep';

const styles = {
  cancel_link: tw`self-end cursor-pointer text-blue-400 no-underline`,
  button: tw`w-full rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-stone-700 border-0`,
  title: tw`my-8 mt-16 text-white text-2xl text-center`,
  titleError: tw`my-8 mt-16 text-red-500 text-2xl text-center`,
  subtitle: tw`text-white text-center text-stone-400`,
  subtitleError: tw`mb-10 text-red-500 text-center`,
  feesRoot: tw`mt-2 text-center text-xs text-stone-400`,
  feeWithTooltip: tw`flex justify-center`,
  loader: tw`flex justify-center content-center my-48`,
  steps: tw`flex flex-col justify-start my-4`,
  stepsList: tw`space-y-4 list-none mb-10`,
  disabledButtonStyles: tw`bg-stone-600 cursor-not-allowed`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-300 text-stone-800`}
  }
`;

export const Stake = () => {
  const { poolId, poolName } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage } = useWallet();

  const [working, setWorking] = useState('idle');
  const [balance, setBalance] = useState<BN | null>(null);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [stakedAccount, setStakedAccount] = useState<StakeAccount | null>(null);
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
      setStakeAmount(b.toNumber() / (1 + feePercentageFraction));
    })();
  }, [publicKey, connection]);

  useEffect(() => {
    if (!publicKey || !poolId || !connection) {
      return;
    }
    (async () => {
      const stakedAccounts = await getStakeAccounts(connection, publicKey);
      if (stakedAccounts != null && stakedAccounts.length > 0) {
        stakedAccounts.forEach((st) => {
          const sa = StakeAccount.deserialize(st.account.data);
          if (sa.stakePool.toBase58() === poolId) {
            setStakedAccount(sa);
            return;
          }
        });
      }
    })();
  }, [publicKey, connection, poolId]);

  useEffect(() => {
    if (!stakedAccount?.owner) {
      return;
    }
    (async () => {
      const sp = await StakePool.retrieve(connection, stakedAccount.stakePool);
      setStakedPool(sp);
    })();
  }, [stakedAccount?.owner]);

  const fee = useMemo(() => {
    return Number(stakeAmount) * feePercentageFraction;
  }, [stakeAmount, feePercentage]);

  const handle = async () => {
    if (
      !publicKey ||
      !poolId ||
      !connection ||
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

      let stakeAccount = null;
      try {
        stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
      } catch {
        setWorking('account');
        const ixAccount = await createStakeAccount(
          new PublicKey(poolId),
          publicKey,
          publicKey,
          ACCESS_PROGRAM_ID
        );
        await sendTx(connection, publicKey, [ixAccount], sendTransaction, {
          skipPreflight: true,
        });
        stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
      }

      // Check if stake ata account exists
      const stakerAta = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        centralState.tokenMint,
        publicKey
      );

      const stakerAtaAccount = await connection.getAccountInfo(stakerAta);
      if (stakerAtaAccount == null) {
        const ataix = Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          centralState.tokenMint,
          stakerAta,
          publicKey,
          publicKey
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

        await sendTx(connection, publicKey, [ix], sendTransaction, {
          preflightCommitment: 'confirmed',
        });
      }

      setWorking('stake');
      const ixStake = await stake(
        connection,
        stakeKey,
        stakerAta,
        Number(stakeAmount) * 10 ** 6,
        ACCESS_PROGRAM_ID
      );
      txs.push(ixStake);

      await sendTx(connection, publicKey, txs, sendTransaction, {
        preflightCommitment: 'confirmed',
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
    return (stakedPool?.minimumStakeAmount.toNumber() ?? 0) / 10 ** 6;
  }, [stakedPool?.minimumStakeAmount]);

  const minStakeAmount = useMemo(() => {
    return Math.max(minPoolStakeAmount - Number(stakedAccount?.stakeAmount), 1);
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
    () => solBalance < 0.000005,
    [solBalance]
  );

  const invalidText = useMemo(() => {
    if (insufficientBalance && stakedAccount?.stakeAmount.gtn(0)) {
      return `Insufficient balance for staking. You need min. of ${
        minStakeAmount + minStakeAmount * feePercentageFraction
      } ACS.`;
    } else if (insufficientSolBalance) {
      return `Insufficient ${solBalance} SOL balance. You need min. of ${0.000005} ACS.`;
    }
    return null;
  }, [insufficientBalance, minStakeAmount, feePercentageFraction]);

  return (
    <Fragment>
      {stakeModalOpen && error && (
        <div>
          <div css={styles.titleError}>Error occured:</div>
          <div css={styles.subtitleError}>{error}</div>
          <RouteLink css={[styles.button, hoverButtonStyles]} href="/">
            Close
          </RouteLink>
        </div>
      )}
      {stakeModalOpen && !error && (
        <div>
          <div css={styles.title}>Steps to complete</div>
          <div css={styles.subtitle}>
            We need you to sign these
            <br /> transactions to stake
          </div>
          <nav css={styles.steps} aria-label="Progress">
            <ol css={styles.stepsList}>
              <ProgressStep
                name="Create staking account"
                status={working === 'account' ? 'current' : 'complete'}
              />
              <ProgressStep
                name="Claim rewards"
                status={
                  working === 'claim'
                    ? 'current'
                    : working === 'account'
                    ? 'pending'
                    : 'complete'
                }
              />
              <ProgressStep
                name="Stake"
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
              href="/"
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
        </div>
      )}
      {!stakeModalOpen && (
        <div>
          <Header>
            <RouteLink href="/" css={styles.cancel_link}>
              Cancel
            </RouteLink>
          </Header>

          {stakedAccount?.stakeAmount && stakedPool && balance ? (
            <Fragment>
              <div css={styles.title}>Stake on &apos;{poolName}&apos;</div>
              <div css={styles.subtitle}>
                Both {poolName} and you will receive a ACS inflation rewards
                split equally.
              </div>

              <NumberInputWithSlider
                min={minStakeAmount}
                max={maxStakeAmount}
                value={stakeAmount}
                disabled={insufficientBalance}
                invalid={insufficientBalance || insufficientSolBalance}
                invalidText={invalidText}
                onChangeOfValue={(value) => {
                  setStakeAmount(value);
                }}
              />

              {insufficientBalance || insufficientSolBalance ? (
                <button css={[styles.button, styles.disabledButtonStyles]}>
                  Stake
                </button>
              ) : (
                <button
                  css={[styles.button, hoverButtonStyles]}
                  onClick={handle}
                >
                  Stake
                </button>
              )}

              <div css={styles.feesRoot}>
                <div css={styles.feeWithTooltip}>
                  <div>Protocol fee: {fee} ACS</div>
                  <Tooltip
                    message={`A ${feePercentage}% is fee deducted from your staked amount and is burned by the protocol.`}
                  >
                    <Info size={16} />
                  </Tooltip>
                </div>
                <div>Transaction fee: 0.000005 SOL ~ $0.00024</div>
              </div>
            </Fragment>
          ) : (
            <div css={styles.loader}>
              <Loading />
            </div>
          )}
        </div>
      )}
    </Fragment>
  );
};
