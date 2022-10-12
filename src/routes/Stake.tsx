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
import { useContext, useEffect, useState } from 'preact/hooks';
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

const styles = {
  cancel_link: tw`self-end cursor-pointer text-blue-400 no-underline`,
  button: tw`w-full rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-gray-700`,
  title: tw`my-8 mt-16 text-white text-2xl text-center`,
  subtitle: tw`text-white text-center text-gray-400`,
  feesRoot: tw`mt-2 text-center text-xs text-gray-400`,
  feeWithTooltip: tw`flex justify-center`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-300 text-gray-800`}
  }
`;

export const Stake = () => {
  const { poolId, poolName } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage } = useWallet();

  const [working, setWorking] = useState('idle');
  const [balance, setBalance] = useState<BN | null>(null);
  const [stakedAmount, setStakedAmount] = useState<BN | null>(null);
  const [stakeAmount, setStakeAmount] = useState<Number>(Number(balance));
  const [stakeModalOpen, setStakeModal] = useState<boolean>(false);
  const openStakeModal = () => setStakeModal(true);
  const closeStakeModal = () => setStakeModal(false);

  useEffect(() => {
    if (!publicKey) return;
    (async () => {
      const balance = await getUserACSBalance(connection, publicKey);
      setBalance(balance);
    })();
  }, [publicKey, connection]);

  useEffect(() => {
    if (!publicKey || !poolId) return;
    (async () => {
      const stakedAccounts = await getStakeAccounts(connection, publicKey);
      if (stakedAccounts != null && stakedAccounts.length > 0) {
        stakedAccounts.forEach((st) => {
          const stakedAccount = StakeAccount.deserialize(st.account.data);
          if (stakedAccount.stakePool.toBase58() === poolId) {
            setStakedAmount(stakedAccount.stakeAmount as BN);
            return;
          }
        });
      }
    })();
  }, [publicKey, connection, poolId]);

  const handle = async () => {
    if (!publicKey || !poolId || !sendTransaction || !balance || !signMessage)
      return;

    try {
      openStakeModal();
      setWorking('account');

      const [centralKey] = await CentralState.getKey(ACCESS_PROGRAM_ID);
      const centralState = await CentralState.retrieve(connection, centralKey);
      const txs = [];

      // Check if stake account exists
      const [stakeKey] = await StakeAccount.getKey(
        ACCESS_PROGRAM_ID,
        publicKey,
        new PublicKey(poolId)
      );

      let poolData = await StakePool.retrieve(
        connection,
        new PublicKey(poolId)
      );
      if (!poolData) {
        throw new Error('Pool not found');
      }

      let stakeAccount = null;
      try {
        stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
      } catch {
        debugger;
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
        stakeAccount.lastClaimedTime < poolData.lastCrankTime
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
          skipPreflight: true,
        });
      }

      setWorking('stake');
      const ixStake = await stake(
        connection,
        stakeKey,
        stakerAta,
        (Number(stakeAmount) -
          Math.floor((Number(stakeAmount) / 101) * 100) / 100) *
          10 ** 6,
        ACCESS_PROGRAM_ID
      );
      txs.push(ixStake);

      await sendTx(connection, publicKey, txs, sendTransaction, {
        skipPreflight: true,
      });
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
      }
    } finally {
      setWorking('idle');
      closeStakeModal();
    }
  };

  const fee = Math.floor((Number(stakeAmount) / 101) * 100) / 100;
  const minStakeAmount = 10_000;
  const insufficientBalance =
    minStakeAmount + minStakeAmount * 0.01 > (balance?.toNumber() ?? 0);

  let invalidText;
  if (insufficientBalance) {
    invalidText = `Insufficient balance for staking. You need min. of ${
      minStakeAmount + minStakeAmount * 0.01
    } ACS.`;
  }

  return (
    <Fragment>
      {stakeModalOpen && <div>State: {working}</div>}
      {!stakeModalOpen && (
        <div>
          <Header>
            <RouteLink href="/" css={styles.cancel_link}>
              Cancel
            </RouteLink>
          </Header>

          <div css={styles.title}>Stake on &apos;{poolName}&apos;</div>
          <div css={styles.subtitle}>
            Both {poolName} and you will receive a ACS inflation rewards split
            equally.
          </div>

          {stakedAmount && balance && (
            <NumberInputWithSlider
              min={
                stakedAmount.toNumber() > 0
                  ? 1
                  : minStakeAmount + minStakeAmount * 0.01
              }
              max={balance?.toNumber() || 0}
              value={stakeAmount}
              disabled={insufficientBalance}
              invalid={insufficientBalance}
              invalidText={invalidText}
              onChangeOfValue={(value) => {
                setStakeAmount(value);
              }}
            />
          )}

          <button css={[styles.button, hoverButtonStyles]} onClick={handle}>
            Stake
          </button>

          <div css={styles.feesRoot}>
            <div css={styles.feeWithTooltip}>
              <div>Protocol fee: {fee} ACS</div>
              <Tooltip message="A 2% is fee deducted from your staked amount and is burned by the protocol.">
                <Info size={16} />
              </Tooltip>
            </div>
            <div>Transaction fee: 0.000005 SOL ~ $0.00024</div>
          </div>
        </div>
      )}
    </Fragment>
  );
};
