import { type FunctionalComponent, h } from 'preact';
import { useCallback } from 'preact/hooks';
import type { ButtonProps } from './Button';
import { Button } from './Button';
import { useWalletModal } from './useWalletModal';

export const WalletModalButton: FunctionalComponent<ButtonProps> = ({
  children = 'Select Wallet',
  onClick,
  ...props
}) => {
  const { visible, setVisible } = useWalletModal();

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) setVisible(!visible);
    },
    [onClick, setVisible, visible]
  );

  return (
    <Button
      className="wallet-adapter-button-trigger"
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};
