import tw, { css } from 'twin.macro';
import { h } from 'preact';
import BN from 'bn.js';
import { Info } from 'phosphor-react';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { useContext, useEffect, useState } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import { useConnection } from '../components/wallet-adapter/useConnection';
import { useWallet } from '../components/wallet-adapter/useWallet';
import { getStakeAccounts, getUserACSBalance } from '../libs/program';
import { Tooltip } from '../components/Tooltip';
import { NumberInputWithSlider } from '../components/NumberInputWithSlider';
import { StakeAccount } from '../../access-protocol/smart-contract/js/src';

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
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<BN | null>(null);
  const [stakedAmount, setStakedAmount] = useState<BN | null>(null);
  const [stakeAmount, setStakeAmount] = useState<Number>(Number(balance));

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

      <button css={[styles.button, hoverButtonStyles]} href="/stake">
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
  );
};
