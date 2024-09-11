import { h } from 'preact';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'preact/hooks';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

import {
  calculateRewardForStaker,
  getBondAccounts,
  getStakeAccounts,
  getUserACSBalance,
} from '../libs/program';
import { ConfigContext } from '../AppContext';
import {
  BondAccount,
  BondV2Account,
  getBondV2Accounts,
  StakeAccount,
  StakePool,
} from '@accessprotocol/js';
import { clsxp, formatPenyACSCurrency } from '../libs/utils';
import { RouteLink } from '../layout/Router';
import { Header } from '../components/Header';
import { useWallet } from '../components/wallet-adapter/useWallet';
import { useConnection } from '../components/wallet-adapter/useConnection';
import env from '../libs/env';

export const Actions = () => {
  const { poolId, classPrefix } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, disconnect, disconnecting, connected } = useWallet();
  const [balance, setBalance] = useState<BN | null>(null);
  const [stakedAccount, setStakedAccount] = useState<
    StakeAccount | null | undefined
  >(undefined);
  const [bondAccounts, setBondAccounts] = useState<BondAccount[]>([]);
  const [bondV2Accounts, setBondV2Accounts] = useState<BondV2Account[]>([]);
  const [stakePool, setStakePool] = useState<StakePool | undefined>(undefined);

  useEffect(() => {
    if (!(publicKey && connection)) {
      return;
    }
    (async () => {
      setBalance(
        await getUserACSBalance(connection, publicKey, env.PROGRAM_ID)
      );
    })();
  }, [publicKey, connection]);

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
      setBondAccounts(
        bAccounts
          .map((bAccount: any) =>
            BondAccount.deserialize(bAccount.account.data)
          )
          .filter(
            (bAccount: BondAccount) => bAccount.stakePool.toBase58() === poolId
          )
      );
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
        bV2Accounts
          .map((bAccount: any) =>
            BondV2Account.deserialize(bAccount.account.data)
          )
          .filter(
            (bAccount: BondV2Account) => bAccount.pool.toBase58() === poolId
          )
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

    return bondAccounts.reduce(
      (acc, ba) =>
        acc +
        calculateRewardForStaker(
          stakePool.currentDayIdx - ba.lastClaimedOffset.toNumber(),
          stakePool,
          ba.totalStaked as BN
        ),
      0
    );
  }, [bondAccounts, stakePool]);

  const claimableBondV2Amount = useMemo(() => {
    if (bondV2Accounts.length === 0 || !stakePool) {
      return null;
    }

    return bondV2Accounts.reduce(
      (acc, ba) =>
        acc +
        calculateRewardForStaker(
          stakePool.currentDayIdx - ba.lastClaimedOffset.toNumber(),
          stakePool,
          ba.amount as BN
        ),
      0
    );
  }, [bondV2Accounts, stakePool]);

  const claimableAmount = useMemo(() => {
    return (
      (claimableBondAmount ?? 0) +
      (claimableStakeAmount ?? 0) +
      (claimableBondV2Amount ?? 0)
    );
  }, [claimableBondAmount, claimableStakeAmount, claimableBondV2Amount]);

  const disconnectHandler = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [disconnect]);

  const hasUnlockableBonds = useMemo(() => {
    if (!stakePool || !bondAccounts) {
      return [];
    }
    return bondAccounts.find((ba) => {
      return ba.unlockStartDate.toNumber() <= Date.now() / 1000;
    });
  }, [stakePool, bondAccounts]);

  const hasUnlockableBondsV2 = useMemo(() => {
    if (!stakePool || !bondV2Accounts) {
      return [];
    }
    return bondV2Accounts.find((ba) => {
      if (!ba.unlockTimestamp) {
        return false;
      }
      return ba.unlockTimestamp.toNumber() <= Date.now() / 1000;
    });
  }, [stakePool, bondV2Accounts]);

  return (
    <div className={clsxp(classPrefix, 'actions_root')}>
      {connected && disconnecting && (
        <Header>
          <div className={clsxp(classPrefix, 'actions_actions_disconnect')}>
            Disconnecting...
          </div>
        </Header>
      )}
      {connected && !disconnecting && (
        <Header>
          <div
            className={clsxp(classPrefix, 'actions_actions_disconnect')}
            onClick={disconnectHandler}
          >
            Disconnect
          </div>
        </Header>
      )}

      <div className={clsxp(classPrefix, 'actions_logo')}>
        <svg
          width='48'
          height='48'
          viewBox='0 0 48 48'
          fill='white'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M22.8221 47.17C30.5621 47.17 37.1321 43.48 40.1021 36.28V46H47.9321V24.13C47.9321 9.91 38.2121 0.369997 24.2621 0.369997C10.1321 0.369997 0.23207 10.18 0.23207 24.13C0.23207 38.8 11.2121 47.17 22.8221 47.17ZM24.1721 39.25C14.9921 39.25 8.87207 32.77 8.87207 23.77C8.87207 14.77 14.9921 8.29 24.1721 8.29C33.3521 8.29 39.4721 14.77 39.4721 23.77C39.4721 32.77 33.3521 39.25 24.1721 39.25Z'
            fill='#E7E5E4'
          />
        </svg>
      </div>

      <div>
        <div
          className={clsxp(
            classPrefix,
            'actions_staked_amount',
            (stakedAccount === undefined || bondAccounts === undefined) &&
              'actions_blink'
          )}
        >
          <div>
            {formatPenyACSCurrency(
              (stakedAccount?.stakeAmount.toNumber() ?? 0) +
                (bondAccounts?.reduce(
                  (acc, ba) => acc + ba.totalStaked.toNumber(),
                  0
                ) ?? 0) +
                (bondV2Accounts?.reduce(
                  (acc, ba) => acc + ba.amount.toNumber(),
                  0
                ) ?? 0)
            )}{' '}
            ACS locked
          </div>
        </div>
        <div
          className={clsxp(
            classPrefix,
            'actions_balance',
            balance === undefined && 'actions_blink'
          )}
        >
          {formatPenyACSCurrency(balance?.toNumber() ?? 0)} ACS available
        </div>
        <div
          className={clsxp(
            classPrefix,
            'actions_balance',
            (stakedAccount === undefined || bondAccounts === undefined) &&
              'actions_blink'
          )}
        >
          {formatPenyACSCurrency(claimableAmount ?? 0)} ACS rewards
        </div>
      </div>

      <div className={clsxp(classPrefix, 'actions_links_wrapper')}>
        <RouteLink
          className={clsxp(classPrefix, 'actions_button')}
          href='/stake'
        >
          Lock
        </RouteLink>
        {(stakedAccount && stakedAccount.stakeAmount.toNumber() > 0) ||
        hasUnlockableBonds ||
        hasUnlockableBondsV2 ? (
          <RouteLink
            className={clsxp(classPrefix, 'actions_button')}
            href='/unstake'
          >
            Unlock ACS
          </RouteLink>
        ) : (
          <span
            className={clsxp(
              classPrefix,
              'actions_button',
              'actions_button_disabled'
            )}
          >
            Unlock ACS
          </span>
        )}
        <RouteLink
          className={clsxp(classPrefix, 'actions_button')}
          href='/claim'
        >
          Claim
        </RouteLink>
      </div>
    </div>
  );
};
