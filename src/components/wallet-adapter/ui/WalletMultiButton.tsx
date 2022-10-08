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
import { useWalletModal } from './useWalletModal';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletIcon } from './WalletIcon';
import { WalletModalButton } from './WalletModalButton';
import tw from 'twin.macro';

export const WalletMultiButton: FunctionalComponent<ButtonProps> = ({
  children,
  ...props
}) => {
  const { publicKey, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
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

  const openDropdown = useCallback(() => {
    setActive(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setActive(false);
  }, []);

  const openModal = useCallback(() => {
    setVisible(true);
    closeDropdown();
  }, [setVisible, closeDropdown]);

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

  const styles = {
    wallet_adapter_dropdown: tw`relative inline-block text-left`,
    wallet_adapter_button_trigger: tw`bg-[#512da8]`,
  };

  return (
    <div css={styles.wallet_adapter_dropdown}>
      <Button
        aria-expanded={active}
        css={styles.wallet_adapter_button_trigger}
        style={{ pointerEvents: active ? 'none' : 'auto', ...props.style }}
        onClick={openDropdown}
        startIcon={<WalletIcon wallet={wallet} />}
        {...props}
      >
        {content}
      </Button>
      <ul
        aria-label="dropdown-list"
        className={`wallet-adapter-dropdown-list ${
          active && 'wallet-adapter-dropdown-list-active'
        }`}
        ref={ref}
        role="menu"
      >
        <li
          onClick={copyAddress}
          className="wallet-adapter-dropdown-list-item"
          role="menuitem"
        >
          {copied ? 'Copied' : 'Copy address'}
        </li>
        <li
          onClick={openModal}
          className="wallet-adapter-dropdown-list-item"
          role="menuitem"
        >
          Change wallet
        </li>
        <li
          onClick={disconnect}
          className="wallet-adapter-dropdown-list-item"
          role="menuitem"
        >
          Disconnect
        </li>
      </ul>
    </div>
  );
};
