import { h } from 'preact';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
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
import env from '../libs/env';
import { clsxp } from '../libs/utils';
import { offchainBasicSubscriptionsSchema } from '../validations/subscriptions';

const Main = () => {
  const { publicKey, wallet, connected } = useWallet();
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLUListElement>(null);
  const {
    element,
    poolId,
    classPrefix,
  } = useContext(ConfigContext);
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
        const response = await fetch(`${env.GO_API_URL}/subscriptions/${publicKey.toBase58()}`);
        if (!response.ok) {
          console.log('ERROR: ', response.statusText);
          return;
        }

        const json = await response.json();
        const data = offchainBasicSubscriptionsSchema.parse(json);

        const { staked, bonds, forever } = data.reduce((acc, item) => {
          if (item.pool === poolId) {
            return {
              staked: acc.staked + (item?.locked ?? 0),
              bonds: acc.bonds + (item?.bonds ?? 0),
              forever: acc.forever + (item?.forever ?? 0),
            };
          } else {
            return acc;
          }
        }, {
          staked: 0,
          bonds: 0,
          forever: 0
        });

        const connectedEvent = new CustomEvent('connected', {
          detail: {
            address: base58,
            locked: staked + bonds + forever,
            staked,
            bonds,
            forever
          },
          bubbles: true,
          cancelable: true,
          composed: false, // if you want to listen on parent turn this on
        });
        console.log('Connected event: ', connectedEvent);
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
