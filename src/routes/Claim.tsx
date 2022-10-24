import tw, { css } from "twin.macro";
import { Fragment, h } from "preact";
import BN from "bn.js";
import { CentralState, StakeAccount, StakePool } from "../libs/ap/state";
import { claimRewards } from "../libs/ap/bindings";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";

import { Header } from "../components/Header";
import { RouteLink } from "../layout/Router";
import { ConfigContext } from "../AppContext";
import { useConnection } from "../components/wallet-adapter/useConnection";
import { useWallet } from "../components/wallet-adapter/useWallet";
import {
  ACCESS_PROGRAM_ID,
  calculateRewardForStaker,
  getStakeAccounts,
} from "../libs/program";
import { sendTx } from "../libs/transactions";
import Loading from "../components/Loading";
import { ProgressStep } from "../components/ProgressStep";
import { formatACSCurrency } from "../libs/utils";

const styles = {
  root: tw`h-[31em] flex flex-col justify-between`,
  cancel_link: tw`self-end cursor-pointer text-blue-400 no-underline`,
  button: tw`w-full rounded-full cursor-pointer no-underline font-bold py-4 mb-4 block text-xl text-center bg-indigo-500 text-stone-700 border-0`,
  title: tw`my-8 mt-16 text-white text-2xl text-center`,
  titleError: tw`mt-8 text-red-500 text-2xl text-center`,
  subtitle: tw`text-white text-center text-stone-400`,
  subtitleError: tw`text-red-500 text-center`,
  claimAmount: tw`text-white mb-40 text-4xl text-center text-green-400`,
  loader: tw`flex justify-center content-center mb-56`,
  steps: tw`flex flex-col justify-start my-4`,
  stepsList: tw`space-y-4 list-none mb-10`,
  disabledButtonStyles: tw`bg-stone-600 cursor-not-allowed`,
  invalid: tw`bg-red-400`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-300 text-stone-800`}
  }
`;

export const Claim = () => {
  const { poolId, poolName } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage } = useWallet();

  const [working, setWorking] = useState("idle");
  const [stakedAccount, setStakedAccount] = useState<StakeAccount | null>(null);
  const [stakedPool, setStakedPool] = useState<StakePool | null>(null);
  const [stakeModalOpen, setStakeModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openStakeModal = () => setStakeModal(true);

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

  const claimableAmount = useMemo(() => {
    if (!stakedAccount || !stakedPool) {
      return null;
    }
    return calculateRewardForStaker(
      stakedAccount.lastClaimedTime as BN,
      stakedPool,
      stakedAccount.stakeAmount as BN
    );
  }, [stakedAccount, stakedPool]);

  const handle = async () => {
    if (
      !publicKey ||
      !poolId ||
      !connection ||
      !sendTransaction ||
      !signMessage ||
      !stakedAccount ||
      !stakedPool
    ) {
      return;
    }

    try {
      openStakeModal();

      const [centralKey] = await CentralState.getKey(ACCESS_PROGRAM_ID);
      const centralState = await CentralState.retrieve(connection, centralKey);

      // Check if stake account exists
      const [stakeKey] = await StakeAccount.getKey(
        ACCESS_PROGRAM_ID,
        publicKey,
        new PublicKey(poolId)
      );

      // Check if stake ata account exists
      const stakerAta = await getAssociatedTokenAddress(
        centralState.tokenMint,
        publicKey,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      if (
        stakedAccount.stakeAmount.toNumber() > 0 &&
        stakedAccount.lastClaimedTime < stakedPool.lastCrankTime
      ) {
        setWorking("claim");
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

      setWorking("done");
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      }
    } finally {
      setWorking("done");
    }
  };

  return (
    <div css={styles.root}>
      {stakeModalOpen && error && (
        <Fragment>
          <div css={styles.titleError}>Error occured:</div>
          <div css={styles.subtitleError}>{error}</div>
          <RouteLink css={[styles.button, hoverButtonStyles]} href="/">
            Close
          </RouteLink>
        </Fragment>
      )}
      {stakeModalOpen && !error && (
        <Fragment>
          <div css={styles.title}>Steps to complete</div>
          <div css={styles.subtitle}>
            We need you to sign these
            <br /> transactions to claim rewards
          </div>
          <nav css={styles.steps} aria-label="Progress">
            <ol css={styles.stepsList}>
              <ProgressStep
                name="Claim rewards"
                status={
                  working === "claim"
                    ? "current"
                    : working === "idle"
                    ? "pending"
                    : "complete"
                }
              />
            </ol>
            <RouteLink
              disabled={working !== "done"}
              href="/"
              css={[
                styles.button,
                working !== "done"
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
            <RouteLink href="/" css={styles.cancel_link}>
              Cancel
            </RouteLink>
          </Header>

          {stakedAccount?.stakeAmount && stakedPool ? (
            <Fragment>
              <div css={styles.title}>Claim on &apos;{poolName}&apos;</div>
              <div css={styles.claimAmount}>
                {formatACSCurrency(claimableAmount?.toNumber() ?? 0)} ACS
              </div>

              <div>
                <button
                  css={[
                    styles.button,
                    hoverButtonStyles,
                    (claimableAmount?.toNumber() ?? 0) <= 0 &&
                      styles.disabledButtonStyles,
                  ]}
                  onClick={handle}
                >
                  Claim
                </button>
              </div>
            </Fragment>
          ) : (
            <div css={styles.loader}>
              <Loading />
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
};
