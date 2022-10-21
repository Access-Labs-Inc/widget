import tw from 'twin.macro';
import { h } from 'preact';
import {
  useCallback,
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

const styles = {
  wallet_adapter_dropdown_wrapper: tw`relative inline-block text-left font-sans`,
  wallet_adapter_button_trigger: tw`bg-stone-400 text-stone-800 border-0 py-3 px-5 text-xl rounded-full`,
  wallet_adapter_button_trigger_active: tw`bg-indigo-400`,
  wallet_adapter_dropdown: tw`absolute mt-2 w-80 px-6 py-4 top-[100%] bg-stone-800 text-white rounded-[1rem] opacity-0`,
  wallet_adapter_dropdown_active: tw`visible opacity-100`,
};

const Main = () => {
  const { publicKey, wallet } = useWallet();
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLUListElement>(null);

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const content = useMemo(() => {
    if (!wallet || !base58) {
      return null;
    }
    return base58.slice(0, 4) + '..' + base58.slice(-4);
  }, [wallet, base58]);

  const toggleDropdown = useCallback(() => {
    setActive(!active);
  }, [active]);

  const closeDropdown = useCallback(() => {
    setActive(false);
  }, []);

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
      <div css={styles.wallet_adapter_dropdown_wrapper}>
        <WalletModalButton />
      </div>
    );
  }
  if (!base58) {
    return (
      <div css={styles.wallet_adapter_dropdown_wrapper}>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div css={styles.wallet_adapter_dropdown_wrapper}>
      <Button
        aria-expanded={active}
        cssClass={[
          styles.wallet_adapter_button_trigger,
          publicKey && styles.wallet_adapter_button_trigger_active,
        ]}
        style={{ pointerEvents: active ? 'none' : 'auto' }}
        onClick={toggleDropdown}
      >
        {content}
      </Button>
      <div
        css={[
          styles.wallet_adapter_dropdown,
          active && styles.wallet_adapter_dropdown_active,
        ]}
        ref={ref}
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
