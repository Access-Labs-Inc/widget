import { type FunctionalComponent, h } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import type { ButtonProps } from './Button';
import { Button } from './Button';
import { useWallet } from '../useWallet';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletModalButton } from './WalletModalButton';
import tw from 'twin.macro';

const styles = {
  wallet_adapter_dropdown: tw`relative inline-block text-left`,
  wallet_adapter_button_trigger: tw`bg-gray-400 text-gray-800 border-0 py-3 px-5 rounded-full`,
  wallet_adapter_button_trigger_active: tw`bg-indigo-400`,
  wallet_adapter_dropdown_list: tw`grid gap-10 absolute top-[100%] bg-gray-800 text-white rounded-[1rem] opacity-0`,
  wallet_adapter_dropdown_list_active: tw`visible opacity-100`,
  wallet_adapter_dropdown_list_item: tw`flex flex-row content-center items-center border-none`,
};

export const WalletMultiButton: FunctionalComponent<ButtonProps> = ({
  children,
  ...props
}) => {
  const { publicKey, wallet, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLUListElement>(null);

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const content = useMemo(() => {
    if (children) return children;
    if (!wallet || !base58) return null;
    return base58.slice(0, 4) + '..' + base58.slice(-4);
  }, [children, wallet, base58]);

  const copyAddress = useCallback(async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 400);
    }
  }, [base58]);

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
    <div css={styles.wallet_adapter_dropdown}>
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
      <ul
        aria-label="dropdown-list"
        css={[
          styles.wallet_adapter_dropdown_list,
          active && styles.wallet_adapter_dropdown_list_active,
        ]}
        ref={ref}
        role="menu"
      >
        <li
          onClick={copyAddress}
          css={styles.wallet_adapter_dropdown_list_item}
          role="menuitem"
        >
          {copied ? 'Copied' : 'Copy address'}
        </li>
        <li
          onClick={disconnect}
          css={styles.wallet_adapter_dropdown_list_item}
          role="menuitem"
        >
          Disconnect
        </li>
      </ul>
    </div>
  );
};
