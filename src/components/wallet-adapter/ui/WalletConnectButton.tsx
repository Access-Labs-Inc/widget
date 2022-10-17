import { useWallet } from '../useWallet';
import { type FunctionalComponent, h } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';
import type { ButtonProps } from './Button';
import { Button } from './Button';
import tw from 'twin.macro';

const styles = {
  wallet_adapter_button_trigger: tw`bg-yellow-600 text-stone-800 border-0 py-3 px-5 text-xl rounded-full`,
};

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
      cssClass={styles.wallet_adapter_button_trigger}
      disabled={disabled || !wallet || connecting || connected}
      onClick={handleClick}
      {...props}
    >
      {content}
    </Button>
  );
};
