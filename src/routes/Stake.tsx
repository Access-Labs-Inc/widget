import { Fragment, h } from "preact";
import { Info } from "phosphor-react";
import {
  BondAccount,
  CentralState,
  StakeAccount,
  StakePool,
} from "../libs/ap/state";
import {
  claimRewards,
  crank,
  createStakeAccount,
  stake,
} from "../libs/ap/bindings";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
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
  getUserACSBalance,
} from "../libs/program";
import { Tooltip } from "../components/Tooltip";
import { NumberInputWithSlider } from "../components/NumberInputWithSlider";
import { sendTx } from "../libs/transactions";
import Loading from "../components/Loading";
import { ProgressModal } from "../components/ProgressModal";
import { clsxp, formatACSCurrency, sleep } from "../libs/utils";
import { useFeePayer } from "../hooks/useFeePayer";
import { WalletAdapterProps } from "@solana/wallet-adapter-base";
import env from "../libs/env";
import BN from "bn.js";

interface FeePaymentData {
  feePayerPubKey: string;
  sendTransaction: WalletAdapterProps["sendTransaction"];
}

const CRANK_STEP = "Crank";
const CREATE_STAKING_ACCOUNT_STEP = "Create locking account";
const CLAIM_REWARDS_STEP = "Claim rewards";
const STAKE_STEP = "Lock ACS";
const DONE_STEP = "Done";
const IDLE_STEP = "Idle";

export const Stake = () => {
  const { poolId, poolName, element, classPrefix } = useContext(ConfigContext);
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
  const [balance, setBalance] = useState<number | null | undefined>(undefined);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [stakedAccount, setStakedAccount] = useState<
    StakeAccount | undefined | null
  >(undefined);
  const [bondAccount, setBondAccount] = useState<
    BondAccount | null | undefined
  >(undefined);
  const [stakedPool, setStakedPool] = useState<StakePool | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(0);
  const [stakeModalOpen, setStakeModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openStakeModal = () => setStakeModal(true);

  const feePercentage = 2;
  const feePercentageFraction = feePercentage / 100;

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

  useEffect(() => {
    if (!(publicKey && connection)) {
      return;
    }
    (async () => {
      const b = await connection.getBalance(publicKey);
      setSolBalance(b / 10 ** 9);
    })();
  }, [publicKey, connection, setSolBalance]);

  useEffect(() => {
    if (!(publicKey && connection)) {
      return;
    }
    (async () => {
      const b = await getUserACSBalance(connection, publicKey, env.PROGRAM_ID);
      const acsBalance = (b?.toNumber() || 0) / 10 ** 6;
      setBalance(acsBalance);
      setStakeAmount(acsBalance / (1 + feePercentageFraction));
    })();
  }, [publicKey, connection, getUserACSBalance]);

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
  }, [publicKey, connection, poolId, setStakedAccount]);

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
  }, [publicKey, connection, poolId, setBondAccount]);

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
  }, [stakeAmount, feePercentageFraction]);

  const handle = async () => {
    let feePayer = publicKey;
    let sendTransaction = sendTransactionWithFeesUnpaid;
    if (
      insufficientSolBalance &&
      publicKey != null &&
      feePaymentState != null
    ) {
      feePayer = new PublicKey(feePaymentState.feePayerPubKey);
      sendTransaction = feePaymentState.sendTransaction;
    }

    if (
      !(publicKey && poolId && connection && feePayer && balance && stakedPool)
    ) {
      return;
    }

    try {
      openStakeModal();

      const [centralKey] = await CentralState.getKey(env.PROGRAM_ID);
      const centralState = await CentralState.retrieve(connection, centralKey);
      const txs = [];

      let hasCranked = false;
      if (
        centralState.lastSnapshotOffset.toNumber() > stakedPool.currentDayIdx ||
        centralState.creationTime.toNumber() +
          86400 * (stakedPool.currentDayIdx + 1) <
          Date.now() / 1000
      ) {
        setWorking(CRANK_STEP);
        const crankTx = await crank(new PublicKey(poolId), env.PROGRAM_ID);
        await sendTx(connection, feePayer, [crankTx], sendTransaction, {
          skipPreflight: true,
        });
        hasCranked = true;
      }

      // Check if stake account exists
      const [stakeKey] = await StakeAccount.getKey(
        env.PROGRAM_ID,
        publicKey,
        new PublicKey(poolId)
      );

      let stakeAccount;
      try {
        stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
      } catch {
        setWorking(CREATE_STAKING_ACCOUNT_STEP);
        const ixAccount = await createStakeAccount(
          new PublicKey(poolId),
          publicKey,
          feePayer,
          env.PROGRAM_ID
        );
        await sendTx(connection, feePayer, [ixAccount], sendTransaction, {
          skipPreflight: true,
        });

        try {
          stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
        } catch (e) {
          console.warn("Stake account not ready yet.");
        }
        let attempts = 0;
        while (stakeAccount == null && attempts < 20) {
          // eslint-disable-next-line no-await-in-loop
          await sleep(1000);
          console.log("Sleeping...");
          // eslint-disable-next-line no-await-in-loop
          try {
            stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
          } catch (e) {
            console.warn("Stake account not ready yet attempt: ", attempts);
          }
          attempts += 1;
        }
      }

      if (stakeAccount == null) {
        // last attempt or throw error
        stakeAccount = await StakeAccount.retrieve(connection, stakeKey);
      }

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
        (stakeAccount.lastClaimedOffset.toNumber() < stakedPool.currentDayIdx ||
          hasCranked)
      ) {
        setWorking(CLAIM_REWARDS_STEP);
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

        const claimEvent = new CustomEvent("claim", {
          detail: {
            address: publicKey.toBase58(),
            locked: claimableStakeAmount,
          },
          bubbles: true,
          cancelable: true,
          composed: false, // if you want to listen on parent turn this on
        });
        element?.dispatchEvent(claimEvent);
      }

      setWorking(STAKE_STEP);
      const ixStake = await stake(
        connection,
        stakeKey,
        stakerAta,
        Number(stakeAmount) * 10 ** 6,
        env.PROGRAM_ID
      );
      txs.push(ixStake);

      await sendTx(connection, feePayer, txs, sendTransaction, {
        skipPreflight: true,
      });

      const lockedEvent = new CustomEvent("lock", {
        detail: {
          address: publicKey.toBase58(),
          amount: Number(stakeAmount) * 10 ** 6,
        },
        bubbles: true,
        cancelable: true,
        composed: false, // if you want to listen on parent turn this on
      });
      element?.dispatchEvent(lockedEvent);

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

  const minPoolStakeAmount = useMemo(() => {
    return (stakedPool?.minimumStakeAmount.toNumber() ?? 0) / 10 ** 6;
  }, [stakedPool?.minimumStakeAmount]);

  const minStakeAmount = useMemo(() => {
    const stakedAmount = Number(stakedAccount?.stakeAmount ?? 0) / 10 ** 6;
    const airdropAmount = Number(bondAccount?.totalStaked ?? 0) / 10 ** 6;
    return Math.max(minPoolStakeAmount - stakedAmount - airdropAmount, 1);
  }, [
    stakedAccount?.stakeAmount,
    bondAccount?.totalStaked,
    minPoolStakeAmount,
  ]);

  console.log("Min stake: ", minStakeAmount);

  const maxStakeAmount = useMemo(() => {
    return Number(balance) / (1 + feePercentageFraction);
  }, [balance, feePercentageFraction]);

  const insufficientBalance = useMemo(() => {
    return (
      minStakeAmount + minStakeAmount * feePercentageFraction > (balance ?? 0)
    );
  }, [balance, minStakeAmount, feePercentageFraction]);

  const insufficientSolBalance = useMemo(() => solBalance === 0, [solBalance]);

  const invalidText = useMemo(() => {
    if (insufficientBalance) {
      return `Insufficient balance for locking. You need min. of ${minStakeAmount} ACS + ${
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
    <div className={clsxp(classPrefix, "stake_root")}>
      {stakeModalOpen && error && (
        <Fragment>
          <div className={clsxp(classPrefix, "stake_title_error")}>
            Error occured:
          </div>
          <div className={clsxp(classPrefix, "stake_subtitle_error")}>
            {error}
          </div>
          <RouteLink className={clsxp(classPrefix, "stake_button")} href="/">
            Close
          </RouteLink>
        </Fragment>
      )}
      {stakeModalOpen && !error && (
        <ProgressModal
          working={working}
          stepOrder={[
            CRANK_STEP,
            CREATE_STAKING_ACCOUNT_STEP,
            CLAIM_REWARDS_STEP,
            STAKE_STEP,
          ]}
          doneStepName={DONE_STEP}
        />
      )}
      {!stakeModalOpen && (
        <Fragment>
          <Header>
            <RouteLink
              href="/"
              className={clsxp(classPrefix, "stake_cancel_link")}
            >
              Cancel
            </RouteLink>
          </Header>

          {stakedAccount !== undefined &&
            bondAccount !== undefined &&
            balance !== undefined && (
              <Fragment>
                <div className={clsxp(classPrefix, "stake_title")}>
                  {poolName}
                </div>
                {!insufficientBalance ? (
                  <div className={clsxp(classPrefix, "stake_subtitle")}>
                    Both {poolName} and you will receive a ACS inflation rewards
                    split equally.
                  </div>
                ) : (
                  <p className={clsxp(classPrefix, "stake_invalid_text")}>
                    {invalidText}
                  </p>
                )}

                <div>
                  {!insufficientBalance && (
                    <NumberInputWithSlider
                      min={insufficientBalance ? 0 : minStakeAmount}
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

                  {insufficientBalance && (
                    <a
                      href={env.GET_ACS_URL}
                      target="_blank"
                      rel="noopener"
                      className={clsxp(
                        classPrefix,
                        "stake_button",
                        "stake_button_invalid"
                      )}
                    >
                      Get ACS/SOL on access
                    </a>
                  )}
                  {!insufficientBalance && (
                    <button
                      className={clsxp(classPrefix, "stake_button")}
                      onClick={handle}
                    >
                      Lock
                    </button>
                  )}

                  <div className={clsxp(classPrefix, "stake_fees_root")}>
                    <div
                      className={clsxp(classPrefix, "stake_fee_with_tooltip")}
                    >
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
          {(stakedAccount === undefined ||
            bondAccount === undefined ||
            stakedPool == null ||
            balance === undefined) && (
            <div className={clsxp(classPrefix, "stake_loader")}>
              <Loading />
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
};
