import { h } from 'preact';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import env from '../libs/env';
import { clsxp, formatPenyACSCurrency } from '../libs/utils';
import { BondAccount, BondV2Account, getBondV2Accounts, StakeAccount, StakePool } from '@accessprotocol/js';
import { calculateRewardForStaker, getBondAccounts, getStakeAccounts } from '../libs/program';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useWallet } from '../components/wallet-adapter/useWallet';
import { useConnection } from '../components/wallet-adapter/useConnection';

export const Claim = () => {
  const { poolId, classPrefix } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [stakedAccount, setStakedAccount] = useState<
    StakeAccount | null | undefined
  >(undefined);
  const [bondAccounts, setBondAccounts] = useState<BondAccount[]>([]);
  const [bondV2Accounts, setBondV2Accounts] = useState<BondV2Account[]>([]);
  const [stakePool, setStakePool] = useState<StakePool | undefined>(undefined);

  useEffect(() => {
    if (!(poolId && connection)) {
      return;
    }
    (async () => {
      setStakePool(await StakePool.retrieve(connection, new PublicKey(poolId)));
    })();
  }, [poolId, connection]);

  useEffect(() => {
    if (!(publicKey && poolId && connection)) {
      return;
    }
    (async () => {
      const stakedAccounts = await getStakeAccounts(
        connection,
        publicKey,
        env.PROGRAM_ID
      );
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
      } else {
        setStakedAccount(null);
      }
    })();
  }, [publicKey, connection, poolId]);

  useEffect(() => {
    if (!(publicKey && poolId && connection)) {
      return;
    }
    (async () => {
      const bAccounts = await getBondAccounts(
        connection,
        publicKey,
        env.PROGRAM_ID
      );
      if (bAccounts != null && bAccounts.length > 0) {
        const bas = bAccounts.filter((st) => {
          const ba = BondAccount.deserialize(st.account.data);
          return ba.stakePool.toBase58() === poolId;
        }).map((bAccount) => BondAccount.deserialize(bAccount.account.data));
        setBondAccounts(bas);
      } else {
        setBondAccounts([]);
      }
    })();
  }, [publicKey, connection, poolId]);

  useEffect(() => {
    if (!(publicKey && poolId && connection)) {
      return;
    }
    (async () => {
      const bV2Accounts = await getBondV2Accounts(
        connection,
        publicKey,
        env.PROGRAM_ID
      );

      setBondV2Accounts(
        bV2Accounts.map((bAccount: any) => BondV2Account.deserialize(bAccount.account.data))
          .filter((bAccount: BondV2Account) => bAccount.pool.toBase58() === poolId)
      );
    })();
  }, [publicKey, connection, poolId]);

  const claimableStakeAmount = useMemo(() => {
    if (!(stakedAccount && stakePool)) {
      return null;
    }
    return calculateRewardForStaker(
      stakePool.currentDayIdx - stakedAccount.lastClaimedOffset.toNumber(),
      stakePool,
      stakedAccount.stakeAmount as BN
    );
  }, [stakedAccount, stakePool]);

  const claimableBondAmount = useMemo(() => {
    if (bondAccounts.length === 0 || !stakePool) {
      return null;
    }

    return bondAccounts.reduce((acc, ba) =>
      acc + calculateRewardForStaker(
        stakePool.currentDayIdx - ba.lastClaimedOffset.toNumber(),
        stakePool,
        ba.totalStaked as BN
      ), 0);
  }, [bondAccounts, stakePool]);

  const claimableBondV2Amount = useMemo(() => {
    if (bondV2Accounts.length === 0 || !stakePool) {
      return null;
    }

    return bondV2Accounts.reduce((acc, ba) =>
      acc + calculateRewardForStaker(
        stakePool.currentDayIdx - ba.lastClaimedOffset.toNumber(),
        stakePool,
        ba.amount as BN
      ), 0);
  }, [bondV2Accounts, stakePool]);

  const claimableAmount = useMemo(() => {
    return (claimableBondAmount ?? 0) + (claimableStakeAmount ?? 0) + (claimableBondV2Amount ?? 0);
  }, [claimableBondAmount, claimableStakeAmount, claimableBondV2Amount]);

  return (
    <div className={clsxp(classPrefix, 'claim_root')}>
      <Header>
        <RouteLink
          href='/'
          className={clsxp(classPrefix, 'claim_cancel_link')}
        >
          Cancel
        </RouteLink>
      </Header>

      <div className={clsxp(classPrefix, 'claim_title')}>Claim ACS Rewards</div>

      <div className={clsxp(classPrefix, 'claim_claim_amount')}>
        {formatPenyACSCurrency(claimableAmount)} ACS
      </div>

      <div className={clsxp(classPrefix, 'claim_subtitle')}>
        ACS reward claim is currently only possible in the Access app.
      </div>

      <div>
        <a
          className={clsxp(classPrefix, 'claim_button')}
          href={`${env.REWARDS_BASE_URL}/${poolId}`}
          target='_blank'
          rel='noopener'
        >
          Claim rewards on Access
        </a>

        <div className={clsxp(classPrefix, 'claim_footnote')}>
          This will redirect you to accessprotocol.co
        </div>
      </div>
    </div>
  );
};
