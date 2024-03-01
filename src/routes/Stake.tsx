import { Fragment, h } from 'preact';
import { Info } from 'phosphor-react';
import {
  BondV2Account,
  CentralStateV2,
  fullLock,
  getBondV2Accounts,
  StakeAccount,
  StakePool,
} from '@accessprotocol/js';
import { PublicKey } from '@solana/web3.js';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { ConfigContext } from '../AppContext';
import { useConnection } from '../components/wallet-adapter/useConnection';
import { useWallet } from '../components/wallet-adapter/useWallet';
import { getStakeAccounts, getUserACSBalance, } from '../libs/program';
import { Tooltip } from '../components/Tooltip';
import { NumberInputWithSlider } from '../components/NumberInputWithSlider';
import Loading from '../components/Loading';
import { ProgressModal } from '../components/ProgressModal';
import { clsxp, formatACSCurrency } from '../libs/utils';
import env from '../libs/env';
import { useFeePayer } from '../hooks/useFeePayer';

const DONE_STEP = 'Done';
const IDLE_STEP = 'Idle';

const ACCOUNT_CREATION_ACS_PRICE = 50;

const calculateFees = (amount: number,
                       feeBasisPoints: number,
                       forever: boolean,
                       stakeAccount?: StakeAccount | null,
                       bondV2Accounts?: BondV2Account[],
) => {
  let accountCreationFee = ACCOUNT_CREATION_ACS_PRICE;
  if ((!forever && stakeAccount) || (forever && bondV2Accounts && bondV2Accounts.length > 0)) {
    accountCreationFee = 0;
  }
  const protocolFee = forever ? 0 : amount * (feeBasisPoints / 10000);
  return protocolFee + accountCreationFee;
};

export const Stake = () => {
  const { poolId, poolName, element, classPrefix } = useContext(ConfigContext);
  const { connection } = useConnection();
  const { publicKey, signTransaction } =
    useWallet();
  const { feePayerPubKey, sendTxThroughGoApi } = useFeePayer();
  const [working, setWorking] = useState(IDLE_STEP);
  const [balance, setBalance] = useState<number | null | undefined>(undefined);
  const [forever, setForever] = useState<boolean>(false);
  const [stakeAccount, setStakeAccount] = useState<
    StakeAccount | undefined | null
  >(undefined);
  const [bondV2Accounts, setBondV2Accounts] = useState<BondV2Account[]>([]);
  const [stakedPool, setStakePool] = useState<StakePool | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(0);
  const [feeBasisPoints, setFeeBasisPoints] = useState<number>(0);
  const [stakeModalOpen, setStakeModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openStakeModal = () => setStakeModal(true);

  // set stake pool
  useEffect(() => {
    if (!poolId) {
      return;
    }
    (async () => {
      const sp = await StakePool.retrieve(connection, new PublicKey(poolId));
      setStakePool(sp);
    })();
  }, [poolId, setStakePool]);

  // set stake account
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
      if (stakedAccounts === null || stakedAccounts.length === 0) {
        setStakeAccount(null);
        return;
      }
      const sAccount = stakedAccounts.find((st) => {
        const sa = StakeAccount.deserialize(st.account.data);
        return sa.stakePool.toBase58() === poolId;
      });
      if (sAccount) {
        const sa = StakeAccount.deserialize(sAccount.account.data);
        setStakeAccount(sa);
      } else {
        setStakeAccount(null);
      }
    })();
  }, [publicKey, connection, poolId, setStakeAccount]);

  // set bond account
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
  }, [publicKey, connection, poolId, setBondV2Accounts]);

  // set fee basis points from the central state
  useEffect(() => {
    if (!(publicKey && connection)) {
      return;
    }
    (async () => {
      const cs = await CentralStateV2.retrieve(
        connection,
        CentralStateV2.getKey(env.PROGRAM_ID)[0],
      );
      setFeeBasisPoints(cs.feeBasisPoints);
    })();
  }, [connection, setFeeBasisPoints]);

  // set ACS balance
  useEffect(() => {
    if (!(publicKey && connection)) {
      return;
    }
    (async () => {
      const b = await getUserACSBalance(connection, publicKey, env.PROGRAM_ID);
      const acsBalance = (b?.toNumber() || 0) / 10 ** 6;
      setBalance(acsBalance);
    })();
  }, [publicKey, connection, stakeAccount, getUserACSBalance]);

  const minStakeAmount = useMemo(() => {
    const stakedAmount = Number(stakeAccount?.stakeAmount ?? 0) / 10 ** 6;
    const minPoolStakeAmount = (stakedPool?.minimumStakeAmount.toNumber() ?? 0) / 10 ** 6;
    const bondV2Amount = Number(bondV2Accounts.reduce((acc, ba) => acc + ba.amount.toNumber(), 0)) / 10 ** 6;
    const relevantLock = forever ? bondV2Amount : stakedAmount;
    return Math.max(minPoolStakeAmount - relevantLock, 1);
  }, [
    stakedPool,
    stakeAccount?.stakeAmount,
    forever,
  ]);

  const maxStakeAmount = useMemo(() => {
    const max = Number(balance) - calculateFees(
      Number(balance),
      feeBasisPoints,
      forever,
      stakeAccount,
      bondV2Accounts,
    );
    return max > 0 ? max : 0;
  }, [balance, feeBasisPoints, forever, stakeAccount, bondV2Accounts]);

  useEffect(() => {
    setStakeAmount(Math.max(maxStakeAmount, minStakeAmount));
  }, [minStakeAmount, maxStakeAmount]);

  const fee = useMemo(() => {
    return calculateFees(
      stakeAmount,
      feeBasisPoints,
      forever,
      stakeAccount,
      bondV2Accounts,
    );
  }, [stakeAmount, feeBasisPoints, forever, stakeAccount, bondV2Accounts]);

  const insufficientBalance = useMemo(() => {
    return (
      minStakeAmount + fee > (balance ?? 0)
    );
  }, [balance, minStakeAmount, fee]);

  console.log('minStakeAmount:', minStakeAmount);
  console.log('fee', fee);

  const invalidText = useMemo(() => {
    if (insufficientBalance) {
      return `Insufficient balance for locking.
        You need min. of ${formatACSCurrency(
        minStakeAmount + fee)
      } ACS (including ACS fees).`;
    }
    return null;
  }, [
    insufficientBalance,
    minStakeAmount,
    fee,
  ]);

  const handle = async () => {
    if (
      !(publicKey && poolId && connection && feePayerPubKey && balance && stakedPool)
    ) {
      return;
    }

    try {
      openStakeModal();

      const isCoinbaseWallet = localStorage.getItem('walletName') === '"Coinbase Wallet"';
      const ixs = await fullLock(
        connection,
        publicKey,
        new PublicKey(poolId),
        isCoinbaseWallet ? feePayerPubKey : publicKey,
        Number(stakeAmount),
        Date.now() / 1000,
        isCoinbaseWallet ? ACCOUNT_CREATION_ACS_PRICE * 1e6 : 0,
        env.PROGRAM_ID,
        undefined,
        stakedPool,
        forever ? 0 : -1,
      );

      const sx = await sendTxThroughGoApi(connection, ixs, signTransaction, publicKey);
      console.log('SIGNATURE:', sx);

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

          {stakeAccount !== undefined &&
            bondV2Accounts !== undefined &&
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
                          type='checkbox'
                          onChange={() => {

                            setForever(!forever);
                          }}
                          checked={forever}
                        />
                        <span
                          className='-mr-3'
                        >Forever Lock</span>
                        <Tooltip
                          messages={['Retain your subscription forever.',
                            'You will be able to claim your rewards ,',
                            'but you will not be able to unlock your funds.'
                          ]}
                        >
                          <Info size={16}/>
                        </Tooltip>
                      </div>
                      {!forever ?
                        (<button
                          className={clsxp(classPrefix, 'stake_button')}
                          disabled={stakeAmount < minStakeAmount}
                          onClick={handle}
                        >
                          Lock
                        </button>) : (<button
                          className={clsxp(classPrefix, 'forever_stake_button')}
                          disabled={stakeAmount < minStakeAmount}
                          onClick={handle}
                        >
                          Forever Lock
                        </button>)
                      }
                    </>
                  )}

                  <div className={clsxp(classPrefix, 'stake_fees_root')}>
                    <div
                      className={clsxp(classPrefix, 'stake_fee_with_tooltip')}
                    >
                      {fee > 0 ? (
                        <>
                          <div>Fees: {formatACSCurrency(fee)} ACS</div>
                          <Tooltip
                            messages={[
                              `${(!forever) ? `Protocol fee (${feeBasisPoints / 100} %): ${stakeAmount * (feeBasisPoints / 10000)} ACS` : ''}`,
                              `${(!forever && !stakeAccount) || (forever && (!bondV2Accounts || bondV2Accounts.length === 0)) ? 'Account creation fee: 50 ACS' : ''}`
                            ]}
                          >
                            <Info size={16}/>
                          </Tooltip>
                        </>
                      ) : (
                        <div>No additional fees</div>
                      )}
                    </div>
                  </div>
                </div>
              </Fragment>
            )}
          {(stakeAccount === undefined ||
            bondV2Accounts === undefined ||
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
