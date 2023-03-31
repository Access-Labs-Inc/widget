import { Fragment, h } from "preact";
import BN from "bn.js";
import {
  BondAccount,
  CentralState,
  StakeAccount,
  StakePool,
} from "../libs/ap/state";
import { claimBondRewards, claimRewards } from "../libs/ap/bindings";
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
  calculateRewardForStaker,
  getBondAccounts,
  getStakeAccounts,
} from "../libs/program";
import { sendTx } from "../libs/transactions";
import Loading from "../components/Loading";
import { formatPenyACSCurrency } from "../libs/utils";
import env from "../libs/env";
import { ProgressModal } from "../components/ProgressModal";
import { useFeePayer } from "../hooks/useFeePayer";
import { WalletAdapterProps } from "@solana/wallet-adapter-base";

const styles = {
  root: `h-[31em] flex flex-col justify-between`,
  cancel_link: `self-end cursor-pointer text-blue-400 no-underline`,
  button: `w-full rounded-full cursor-pointer no-underline font-bold py-4 mb-4 block text-xl text-center bg-indigo-500 text-stone-700 border-0`,
  title: `my-8 mt-16 text-white text-2xl text-center`,
  titleError: `mt-8 text-red-500 text-2xl text-center`,
  subtitle: `text-white text-center text-stone-400`,
  subtitleError: `text-red-500 text-center`,
  claimAmount: `text-white mb-40 text-4xl text-center text-green-400`,
  loader: `flex justify-center content-center mb-56`,
  steps: `flex flex-col justify-start my-4`,
  stepsList: `space-y-4 list-none mb-10`,
  disabledButtonStyles: `bg-stone-600 cursor-not-allowed`,
  invalid: `bg-red-400`,
};

// const hoverButtonStyles = css`
//   &:hover {
//     ${`bg-indigo-300 text-stone-800`}
//   }
// `;

const CLAIM_BOND_REWARDS_STEP = "Claim airdrop rewards";
const CLAIM_STAKE_REWARDS_STEP = "Claim stake rewards";
const DONE_STEP = "Done";
const IDLE_STEP = "Idle";

interface FeePaymentData {
  feePayerPubKey: string;
  sendTransaction: WalletAdapterProps["sendTransaction"];
}

export const Claim = () => {
  const { poolId, poolName, element } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, sendTransaction: sendTransactionWithFeesUnpaid } =
    useWallet();

  const [feePaymentState, setFeePayer] = useState<FeePaymentData | undefined>();

  useEffect(() => {
    (async () => {
      const { feePayerPubKey: pubkey, sendTransaction } = await useFeePayer({
        sendTransaction: sendTransactionWithFeesUnpaid,
      });
      setFeePayer({ feePayerPubKey: pubkey, sendTransaction });
    })();
  }, [publicKey]);

  const [working, setWorking] = useState(IDLE_STEP);
  const [stakedAccount, setStakedAccount] = useState<StakeAccount | null>(null);
  const [bondAccount, setBondAccount] = useState<
    BondAccount | null | undefined
  >(undefined);
  const [stakedPool, setStakedPool] = useState<StakePool | null>(null);
  const [stakeModalOpen, setStakeModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openStakeModal = () => setStakeModal(true);

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
        return;
      }
      setStakedAccount(null);
    })();
  }, [publicKey, connection, poolId]);

  useEffect(() => {
    if (!(publicKey && poolId)) {
      return;
    }
    (async () => {
      const bondAccounts = await getBondAccounts(
        connection,
        publicKey,
        env.PROGRAM_ID
      );
      if (bondAccounts != null && bondAccounts.length > 0) {
        const bAccount = bondAccounts.find((st) => {
          const sa = BondAccount.deserialize(st.account.data);
          return sa.stakePool.toBase58() === poolId;
        });
        if (bAccount) {
          const ba = BondAccount.deserialize(bAccount.account.data);
          setBondAccount(ba);
        } else {
          setBondAccount(null);
        }
      } else {
        setBondAccount(null);
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

  const claimableStakeAmount = useMemo(() => {
    if (!(stakedAccount && stakedPool)) {
      return null;
    }
    return calculateRewardForStaker(
      stakedPool.currentDayIdx - stakedAccount.lastClaimedOffset.toNumber(),
      stakedPool,
      stakedAccount.stakeAmount as BN
    );
  }, [stakedAccount, stakedPool]);

  const claimableBondAmount = useMemo(() => {
    if (!(bondAccount && stakedPool)) {
      return null;
    }
    return calculateRewardForStaker(
      stakedPool.currentDayIdx - bondAccount.lastClaimedOffset.toNumber(),
      stakedPool,
      bondAccount.totalStaked as BN
    );
  }, [bondAccount, stakedPool]);

  const claimableAmount = useMemo(() => {
    return (claimableBondAmount ?? 0) + (claimableStakeAmount ?? 0);
  }, [claimableBondAmount, claimableStakeAmount]);

  const handle = async () => {
    if (
      !(
        publicKey &&
        poolId &&
        connection &&
        stakedAccount &&
        bondAccount &&
        stakedPool
      )
    ) {
      return;
    }

    let feePayer = publicKey;
    let sendTransaction = sendTransactionWithFeesUnpaid;
    if (publicKey != null && feePaymentState != null) {
      feePayer = new PublicKey(feePaymentState.feePayerPubKey);
      sendTransaction = feePaymentState.sendTransaction;
    }

    try {
      openStakeModal();

      const [centralKey] = await CentralState.getKey(env.PROGRAM_ID);
      const centralState = await CentralState.retrieve(connection, centralKey);

      const [stakeKey] = await StakeAccount.getKey(
        env.PROGRAM_ID,
        publicKey,
        new PublicKey(poolId)
      );

      const [bondKey] = await BondAccount.getKey(
        env.PROGRAM_ID,
        publicKey,
        bondAccount.totalAmountSold.toNumber()
      );

      const stakerAta = await getAssociatedTokenAddress(
        centralState.tokenMint,
        publicKey,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      if (claimableStakeAmount && claimableStakeAmount > 0) {
        setWorking(CLAIM_STAKE_REWARDS_STEP);
        const ix = await claimRewards(
          connection,
          stakeKey,
          stakerAta,
          env.PROGRAM_ID,
          true
        );

        await sendTx(connection, feePayer, [ix], sendTransaction, {
          skipPreflight: true,
        });
      }

      if (claimableBondAmount && claimableBondAmount > 0) {
        setWorking(CLAIM_BOND_REWARDS_STEP);
        const ix = await claimBondRewards(
          connection,
          bondKey,
          stakerAta,
          env.PROGRAM_ID,
          true
        );

        await sendTx(connection, feePayer, [ix], sendTransaction, {
          skipPreflight: true,
        });
      }

      const claimEvent = new CustomEvent("claim", {
        detail: {
          address: publicKey.toBase58(),
          locked: claimableStakeAmount,
          airdrop: claimableBondAmount,
        },
        bubbles: true,
        cancelable: true,
        composed: false, // if you want to listen on parent turn this on
      });
      element?.dispatchEvent(claimEvent);

      setWorking(DONE_STEP);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      }
    } finally {
      setWorking(DONE_STEP);
    }
  };

  return (
    <div className={styles.root}>
      {stakeModalOpen && error && (
        <Fragment>
          <div className={styles.titleError}>Error occured:</div>
          <div className={styles.subtitleError}>{error}</div>
          <RouteLink css={[styles.button, hoverButtonStyles]} href="/">
            Close
          </RouteLink>
        </Fragment>
      )}
      {stakeModalOpen && !error && (
        <ProgressModal
          working={working}
          stepOrder={[CLAIM_BOND_REWARDS_STEP, CLAIM_STAKE_REWARDS_STEP]}
          doneStepName={DONE_STEP}
        />
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
              <div className={styles.title}>
                Claim on &apos;{poolName}&apos;
              </div>
              <div className={styles.claimAmount}>
                {formatPenyACSCurrency(claimableAmount)} ACS
              </div>

              <div>
                <button
                  className={[
                    styles.button,
                    hoverButtonStyles,
                    claimableAmount <= 0 && styles.disabledButtonStyles,
                  ].join(" ")}
                  onClick={handle}
                >
                  Claim
                </button>
              </div>
            </Fragment>
          ) : (
            <div className={styles.loader}>
              <Loading />
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
};
