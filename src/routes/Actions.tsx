import tw, { css } from "twin.macro";
import { Fragment, h } from "preact";
import { RouteLink } from "../layout/Router";
import { Header } from "../components/Header";
import { useWallet } from "../components/wallet-adapter/useWallet";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { useConnection } from "../components/wallet-adapter/useConnection";
import {
  calculateRewardForStaker,
  getStakeAccounts,
  getUserACSBalance,
} from "../libs/program";
import BN from "bn.js";
import { ConfigContext } from "../AppContext";
import {
  StakeAccount,
  StakePool,
} from "../../access-protocol/smart-contract/js/src";
import { PublicKey } from "@solana/web3.js";
import Loading from "../components/Loading";

const styles = {
  links_wrapper: tw`block my-4 mt-8 flex flex-col gap-3`,
  actions_disconnect: tw`self-end cursor-pointer text-red-400 no-underline`,
  logo: tw`my-8 mt-16 flex items-center justify-center`,
  button: tw`rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center text-indigo-500 bg-gray-700`,
  balance: tw`text-white text-center text-gray-400`,
  stakedAmount: tw`text-xl text-white text-center my-3`,
  disabledButtonStyles: tw`bg-gray-500 text-gray-300 cursor-not-allowed`,
  loader: tw`flex justify-center content-center my-14`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-500 text-gray-800`}
  }
`;

export const Actions = () => {
  const { poolId } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, disconnect } = useWallet();
  const [balance, setBalance] = useState<BN | null>(null);
  const [stakeAccount, setStakeAccount] = useState<StakeAccount | null>(null);
  const [stakePool, setStakePool] = useState<StakePool | null>(null);

  useEffect(() => {
    if (!publicKey) {
      return;
    }
    (async () => {
      const b = await getUserACSBalance(connection, publicKey);
      setBalance(b);
    })();
  }, [publicKey, connection]);

  useEffect(() => {
    if (!stakeAccount || !poolId || stakePool) {
      return;
    }
    (async () => {
      const sp = await StakePool.retrieve(connection, new PublicKey(poolId));
      setStakePool(sp);
    })();
  }, [poolId, stakeAccount, stakePool, connection]);

  useEffect(() => {
    if (!publicKey || !poolId) {
      return;
    }
    (async () => {
      const stakedAccounts = await getStakeAccounts(connection, publicKey);
      if (stakedAccounts != null && stakedAccounts.length > 0) {
        stakedAccounts.forEach((st) => {
          const sa = StakeAccount.deserialize(st.account.data);
          if (sa.stakePool.toBase58() === poolId) {
            setStakeAccount(sa);
            return;
          }
        });
      }
    })();
  }, [publicKey, connection, poolId]);

  const claimableAmount = useMemo(() => {
    if (!stakeAccount || !stakePool) {
      return new BN(0);
    }
    return calculateRewardForStaker(
      stakeAccount.lastClaimedTime as BN,
      stakePool,
      stakeAccount.stakeAmount as BN
    );
  }, [stakeAccount, stakePool]);

  return (
    <div>
      <Header>
        <div onClick={disconnect} css={styles.actions_disconnect}>
          Disconnect
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

      {stakeAccount?.stakeAmount && balance && claimableAmount ? (
        <Fragment>
          <div css={styles.stakedAmount}>
            {stakeAccount?.stakeAmount.toNumber().toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ACS staked
          </div>
          <div css={styles.balance}>
            {balance.toNumber().toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ACS available
          </div>
          <div css={styles.balance}>
            {claimableAmount.toNumber().toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ACS claimable
          </div>
        </Fragment>
      ) : (
        <div css={styles.loader}>
          <Loading />
        </div>
      )}

      <div css={styles.links_wrapper}>
        <RouteLink css={[styles.button, hoverButtonStyles]} href="/stake">
          Stake
        </RouteLink>
        {stakeAccount && stakeAccount.stakeAmount.toNumber() > 0 ? (
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
