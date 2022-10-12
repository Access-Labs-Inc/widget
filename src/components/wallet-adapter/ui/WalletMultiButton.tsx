import tw from 'twin.macro';
import { type FunctionalComponent, h } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { type ButtonProps, Button } from './Button';
import { useWallet } from '../useWallet';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletModalButton } from './WalletModalButton';
import { Router, RouteComponent } from '../../../layout/Router';
import { Actions } from '../../../routes/Actions';
import { Stake } from '../../../routes/Stake';
import { Unstake } from '../../../routes/Unstake';
import { Claim } from '../../../routes/Claim';

const styles = {
  wallet_adapter_dropdown_wrapper: tw`relative inline-block text-left font-sans`,
  wallet_adapter_button_trigger: tw`bg-gray-400 text-gray-800 border-0 py-3 px-5 text-xl rounded-full`,
  wallet_adapter_button_trigger_active: tw`bg-indigo-400`,
  wallet_adapter_dropdown: tw`absolute mt-2 w-80 px-6 py-4 top-[100%] bg-gray-800 text-white rounded-[1rem] opacity-0`,
  wallet_adapter_dropdown_active: tw`visible opacity-100`,
};

export const WalletMultiButton: FunctionalComponent<ButtonProps> = ({
  children,
  ...props
}) => {
  const { publicKey, wallet } = useWallet();
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLUListElement>(null);

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const content = useMemo(() => {
    if (children) return children;
    if (!wallet || !base58) return null;
    return base58.slice(0, 4) + '..' + base58.slice(-4);
  }, [children, wallet, base58]);

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
      if (!node || node.contains(event.target as Node)) return;

      closeDropdown();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, closeDropdown]);

  if (!wallet)
    return <WalletModalButton {...props}>{children}</WalletModalButton>;
  if (!base58)
    return <WalletConnectButton {...props}>{children}</WalletConnectButton>;

  return (
    <div css={styles.wallet_adapter_dropdown_wrapper}>
      <Button
        aria-expanded={active}
        cssClass={[
          styles.wallet_adapter_button_trigger,
          publicKey && styles.wallet_adapter_button_trigger_active,
        ]}
        style={{ pointerEvents: active ? 'none' : 'auto', ...props.style }}
        onClick={toggleDropdown}
        {...props}
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
