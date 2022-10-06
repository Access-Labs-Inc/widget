import { useWallet } from '../useWallet';
import { type FunctionalComponent, h } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';
import type { ButtonProps } from './Button';
import { Button } from './Button';
import { WalletIcon } from './WalletIcon';

export const WalletConnectButton: FunctionalComponent<ButtonProps> = ({
  children,
  disabled,
  onClick,
  ...props
}) => {
  const { wallet, connect, connecting, connected } = useWallet();

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (onClick) onClick(event);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      if (!event.defaultPrevented) connect().catch(() => {});
    },
    [onClick, connect]
  );

  const content = useMemo(() => {
    if (children) return children;
    if (connecting) return 'Connecting ...';
    if (connected) return 'Connected';
    if (wallet) return 'Connect';
    return 'Connect Wallet';
  }, [children, connecting, connected, wallet]);

  return (
    <Button
      className="wallet-adapter-button-trigger"
      disabled={disabled || !wallet || connecting || connected}
      startIcon={wallet ? <WalletIcon wallet={wallet} /> : undefined}
      onClick={handleClick}
      {...props}
    >
      {content}
    </Button>
  );
};
