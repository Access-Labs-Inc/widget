import tw, { css } from "twin.macro";
import { h } from "preact";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import {
  calculateRewardForStaker,
  getStakeAccounts,
  getUserACSBalance,
} from "../libs/program";
import { ConfigContext } from "../AppContext";
import { StakeAccount, StakePool } from "../libs/ap/state";
import { formatACSCurrency } from "../libs/utils";
import { RouteLink } from "../layout/Router";
import { Header } from "../components/Header";
import { useConnection } from "../components/useConnection";
import { useWeb3Auth } from "../components/web3auth/useWeb3Auth";

const styles = {
  root: tw`h-[31em] flex flex-col justify-between`,
  links_wrapper: tw`block my-4 mt-8 flex flex-col gap-3`,
  actions_disconnect: tw`self-end cursor-pointer text-red-400 no-underline`,
  logo: tw`mt-8 flex items-center justify-center`,
  button: tw`rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center text-indigo-500 bg-stone-700`,
  balance: tw`text-white text-center text-stone-400`,
  stakedAmount: tw`text-xl text-white text-center my-3`,
  disabledButtonStyles: tw`bg-stone-500 text-stone-300 cursor-not-allowed`,
  loader: tw`flex justify-center content-center`,
  blink: tw`animate-pulse`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-500 text-stone-800`}
  }
`;

export const Actions = () => {
  const { poolId } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, logout } = useWeb3Auth();
  const [balance, setBalance] = useState<BN | null>(null);
  const [stakedAccount, setStakedAccount] = useState<
    StakeAccount | null | undefined
  >(undefined);
  const [stakePool, setStakePool] = useState<StakePool | undefined>(undefined);

  useEffect(() => {
    if (!publicKey) {
      return;
    }
    (async () => {
      setBalance(await getUserACSBalance(connection, publicKey));
    })();
  }, [publicKey, connection]);

  useEffect(() => {
    if (!stakedAccount || !poolId || stakePool) {
      return;
    }
    (async () => {
      setStakePool(await StakePool.retrieve(connection, new PublicKey(poolId)));
    })();
  }, [poolId, stakedAccount, stakePool, connection]);

  useEffect(() => {
    if (!publicKey || !poolId) {
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
      } else {
        setStakedAccount(null);
      }
    })();
  }, [publicKey, connection, poolId]);

  const claimableAmount = useMemo(() => {
    if (!stakedAccount || !stakePool) {
      return null;
    }
    return calculateRewardForStaker(
      stakedAccount.lastClaimedTime as BN,
      stakePool,
      stakedAccount.stakeAmount as BN
    );
  }, [stakedAccount, stakePool]);

  return (
    <div css={styles.root}>
      <Header>
        <div onClick={logout} css={styles.actions_disconnect}>
          Logout
        </div>
      </Header>

      <div css={styles.logo}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.8221 47.17C30.5621 47.17 37.1321 43.48 40.1021 36.28V46H47.9321V24.13C47.9321 9.91 38.2121 0.369997 24.2621 0.369997C10.1321 0.369997 0.23207 10.18 0.23207 24.13C0.23207 38.8 11.2121 47.17 22.8221 47.17ZM24.1721 39.25C14.9921 39.25 8.87207 32.77 8.87207 23.77C8.87207 14.77 14.9921 8.29 24.1721 8.29C33.3521 8.29 39.4721 14.77 39.4721 23.77C39.4721 32.77 33.3521 39.25 24.1721 39.25Z"
            fill="#E7E5E4"
          />
        </svg>
      </div>

      <div>
        <div
          css={[
            styles.stakedAmount,
            setStakedAccount === undefined && styles.blink,
          ]}
        >
          {formatACSCurrency(stakedAccount?.stakeAmount.toNumber() ?? 0)} ACS
          staked
        </div>
        <div css={[styles.balance, balance === undefined && styles.blink]}>
          {formatACSCurrency(balance?.toNumber() ?? 0)} ACS available
        </div>
        <div
          css={[styles.balance, claimableAmount === undefined && styles.blink]}
        >
          {formatACSCurrency(claimableAmount?.toNumber() ?? 0)} ACS claimable
        </div>
      </div>

      <div css={styles.links_wrapper}>
        <RouteLink css={[styles.button, hoverButtonStyles]} href="/stake">
          Stake
        </RouteLink>
        {stakedAccount && stakedAccount.stakeAmount.toNumber() > 0 ? (
          <RouteLink css={[styles.button, hoverButtonStyles]} href="/unstake">
            Unstake
          </RouteLink>
        ) : (
          <span css={[styles.button, styles.disabledButtonStyles]}>
            Unstake
          </span>
        )}
        {claimableAmount && claimableAmount.toNumber() > 0 ? (
          <RouteLink css={[styles.button, hoverButtonStyles]} href="/claim">
            Claim
          </RouteLink>
        ) : (
          <span css={[styles.button, styles.disabledButtonStyles]}>Claim</span>
        )}
      </div>
    </div>
  );
};
