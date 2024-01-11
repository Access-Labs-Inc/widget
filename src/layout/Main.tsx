import { h } from 'preact';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Router, RouteComponent } from '../layout/Router';
import { Actions } from '../routes/Actions';
import { Stake } from '../routes/Stake';
import { Unstake } from '../routes/Unstake';
import { Claim } from '../routes/Claim';
import { Button } from '../components/wallet-adapter/ui/Button';
import { WalletConnectButton } from '../components/wallet-adapter/ui/WalletConnectButton';
import { WalletModalButton } from '../components/wallet-adapter/ui/WalletModalButton';
import { useWallet } from '../components/wallet-adapter/useWallet';
import { ConfigContext } from '../AppContext';
import { BondAccount, StakeAccount } from '@accessprotocol/js';
import env from '../libs/env';
import { useConnection } from '../components/wallet-adapter/useConnection';
import { getBondAccounts } from '../libs/program';
import { clsxp } from '../libs/utils';

const Main = () => {
  const { publicKey, wallet, connected } = useWallet();
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLUListElement>(null);
  const {
    disconnectButtonClass,
    connectedButtonClass,
    element,
    poolId,
    classPrefix,
  } = useContext(ConfigContext);
  const { connection } = useConnection();

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const content = useMemo(() => {
    if (!wallet || !base58) {
      return null;
    }
    return `${base58.slice(0, 4)}..${base58.slice(-4)}`;
  }, [wallet, base58]);

  const toggleDropdown = useCallback(() => {
    setActive(!active);
  }, [active]);

  const closeDropdown = useCallback(() => {
    setActive(false);
  }, []);

  useEffect(() => {
    if (connected && element && publicKey && poolId) {
      (async () => {
        const [stakeAccountKey] = await StakeAccount.getKey(
          env.PROGRAM_ID,
          publicKey,
          new PublicKey(poolId)
        );
        let stakeAccount;
        try {
          stakeAccount = await StakeAccount.retrieve(
            connection,
            stakeAccountKey
          );
        } catch (e) {
          console.log('No stake account found');
        }
        const bondAccounts = await getBondAccounts(
          connection,
          publicKey,
          env.PROGRAM_ID
        );
        let baSum = new BN(0);
        if (bondAccounts != null && bondAccounts.length > 0) {
          try {
            baSum = bondAccounts.reduce((acc, bAccount) => {
              const ba = BondAccount.deserialize(bAccount.account.data);
              if (ba.stakePool.toBase58() === poolId) {
                acc = acc.add(ba.totalStaked);
              }
              return acc;
            }, new BN(0));
          } catch (e) {
            console.log('Error parsing bond accounts', e);
          }
        } else {
          console.log('No bond accounts found');
        }
        const connectedEvent = new CustomEvent('connected', {
          detail: {
            address: base58,
            locked: stakeAccount?.stakeAmount.toNumber() || 0,
            airdrop: baSum.toNumber(),
          },
          bubbles: true,
          cancelable: true,
          composed: false, // if you want to listen on parent turn this on
        });
        element.dispatchEvent(connectedEvent);
      })();
    }
  }, [connected, element]);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const node = ref.current;

      // Do nothing if clicking dropdown or its descendants
      if (!node || node.contains(event.target as Node)) {
        return;
      }

      closeDropdown();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, closeDropdown]);

  if (!wallet) {
    return (
      <div className={clsxp(classPrefix, 'wallet_adapter_dropdown_wrapper')}>
        <WalletModalButton />
      </div>
    );
  }
  if (!base58) {
    return (
      <div className={clsxp(classPrefix, 'wallet_adapter_dropdown_wrapper')}>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className={clsxp(classPrefix, 'wallet_adapter_dropdown_wrapper')}>
      <Button
        aria-expanded={active}
        className={clsxp(
          classPrefix,
          'wallet_adapter_button_trigger',
          active && 'wallet_adapter_button_trigger_active'
        )}
        style={{ pointerEvents: active ? 'none' : 'auto' }}
        onClick={toggleDropdown}
      >
        {content}
      </Button>
      <div
        className={clsxp(
          classPrefix,
          'wallet_adapter_dropdown',
          active && 'wallet_adapter_dropdown_active'
        )}
      >
        <Router
          routes={{
            '/': <RouteComponent component={Actions} />,
            '/stake': <RouteComponent component={Stake} />,
            '/unstake': <RouteComponent component={Unstake} />,
            '/claim': <RouteComponent component={Claim} />,
          }}
        />
      </div>
    </div>
  );
};

export default Main;
