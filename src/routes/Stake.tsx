import { Fragment, h } from 'preact';
import { Info } from 'phosphor-react';
import { BondAccount, fullLock, StakeAccount, StakePool, } from '@accessprotocol/js'
import { PublicKey } from '@solana/web3.js';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { ConfigContext } from '../AppContext';
import { useConnection } from '../components/wallet-adapter/useConnection';
import { useWallet } from '../components/wallet-adapter/useWallet';
import { getBondAccounts, getStakeAccounts, getUserACSBalance, } from '../libs/program';
import { Tooltip } from '../components/Tooltip';
import { NumberInputWithSlider } from '../components/NumberInputWithSlider';
import { sendTx } from '../libs/transactions';
import Loading from '../components/Loading';
import { ProgressModal } from '../components/ProgressModal';
import { clsxp, formatACSCurrency } from '../libs/utils';
import { useFeePayer } from '../hooks/useFeePayer';
import { WalletAdapterProps } from '@solana/wallet-adapter-base';
import env from '../libs/env';

interface FeePaymentData {
  feePayerPubKey: string;
  sendTransaction: WalletAdapterProps['sendTransaction'];
}

const DONE_STEP = 'Done';
const IDLE_STEP = 'Idle';

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
  const [forever, setForever] = useState<boolean>(false);
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

  const ACCOUNT_CREATION_ACS_PRICE = 50

  const fee = useMemo(() => {
    return Number(stakeAmount) * feePercentageFraction + 30;
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

      const ixs = await fullLock(
        connection,
        publicKey,
        new PublicKey(poolId),
        feePayer,
        Number(stakeAmount),
        Date.now() / 1000,
        ACCOUNT_CREATION_ACS_PRICE,
        env.PROGRAM_ID,
        undefined,
        stakedPool,
        forever ? 0 : -1,
        )

      await sendTx(connection, feePayer, ixs, sendTransaction, {
        skipPreflight: false,
      });

      const lockedEvent = new CustomEvent('lock', {
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

  const transactionFeeSOL = stakedAccount ? 0.000005 : 0.0015;
  const transactionFeeMicroACS = stakedAccount ? 0 : 30;

  const maxStakeAmount = useMemo(() => {
    return (Number(balance) / (1 + feePercentageFraction)) - transactionFeeMicroACS;
  }, [balance, feePercentageFraction, transactionFeeMicroACS]);

  const insufficientBalance = useMemo(() => {
    return (
      minStakeAmount + transactionFeeMicroACS + minStakeAmount * feePercentageFraction > (balance ?? 0)
    );
  }, [balance, minStakeAmount, feePercentageFraction, transactionFeeMicroACS]);

  const insufficientSolBalance = useMemo(() => solBalance < transactionFeeSOL, [solBalance, transactionFeeMicroACS]);

  const invalidText = useMemo(() => {
    if (insufficientBalance) {
      return `Insufficient balance for locking.
        You need min. of ${formatACSCurrency(minStakeAmount + minStakeAmount * feePercentageFraction)} ACS +
        ${formatACSCurrency(transactionFeeMicroACS)} ACS protocol fee.`;
    }
    return null;
  }, [
    insufficientBalance,
    transactionFeeMicroACS,
    minStakeAmount,
    feePercentageFraction,
    stakedAccount?.stakeAmount,
  ]);

  return (
    <div className={clsxp(classPrefix, 'stake_root')}>
      {stakeModalOpen && error && (
        <Fragment>
          <div className={clsxp(classPrefix, 'stake_title_error')}>
            Error occured:
          </div>
          <div className={clsxp(classPrefix, 'stake_subtitle_error')}>
            {error}
          </div>
          <RouteLink className={clsxp(classPrefix, 'stake_button')} href='/'>
            Close
          </RouteLink>
        </Fragment>
      )}
      {stakeModalOpen && !error && (
        <ProgressModal
          working={working}
          doneStepName={DONE_STEP}
        />
      )}
      {!stakeModalOpen && (
        <Fragment>
          <Header>
            <RouteLink
              href='/'
              className={clsxp(classPrefix, 'stake_cancel_link')}
            >
              Cancel
            </RouteLink>
          </Header>

          {stakedAccount !== undefined &&
            bondAccount !== undefined &&
            balance !== undefined && (
              <Fragment>
              <div className={clsxp(classPrefix, 'stake_title')}>
                {poolName}
              </div>
              {!insufficientBalance ? (
                <div className={clsxp(classPrefix, 'stake_subtitle')}>
                  Both {poolName} and you will get ACS rewards
                  split equally.
                </div>
              ) : (
                <p className={clsxp(classPrefix, 'stake_invalid_text')}>
                  {invalidText}
                </p>
              )}

              <div>
                {insufficientBalance && (
                  <a
                    href={env.GET_ACS_URL}
                    target='_blank'
                    rel='noopener'
                    className={clsxp(
                      classPrefix,
                      'stake_button',
                      'stake_button_invalid'
                    )}
                  >
                    Get ACS/SOL on access
                  </a>
                )}
                {!insufficientBalance && (
                  <>
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
                    <div className={clsxp(classPrefix, 'stake_checkbox')}>
                        <input
                          type="checkbox"
                          onChange={() => {
                            setForever(!forever);
                          }}
                          checked={forever}
                        />
                        <span>Lock forever?</span>
                    </div>
                    <button
                      className={clsxp(classPrefix, 'stake_button')}
                      onClick={handle}
                    >
                      { forever ? 'Lock forever' : 'Lock' }
                    </button>
                  </>
                )}

                <div className={clsxp(classPrefix, 'stake_fees_root')}>
                  <div
                    className={clsxp(classPrefix, 'stake_fee_with_tooltip')}
                  >
                    <div>Protocol fee: {formatACSCurrency(fee)} ACS</div>
                    <Tooltip
                      message={`A ${feePercentage}% is fee deducted from your staked amount and is burned by the protocol.`}
                    >
                      <Info size={16}/>
                    </Tooltip>
                  </div>
                  <div>Transaction fee: {transactionFeeSOL} SOL</div>
                </div>
              </div>
              </Fragment>
            )}
          {(stakedAccount === undefined ||
            bondAccount === undefined ||
            stakedPool == null ||
            balance === undefined) && (
            <div className={clsxp(classPrefix, 'stake_loader')}>
              <Loading/>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
};
