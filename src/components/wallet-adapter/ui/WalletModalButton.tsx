import { type FunctionalComponent, h } from "preact";
import { useCallback } from "preact/hooks";
import type { ButtonProps } from "./Button";
import { Button } from "./Button";
import { useWalletModal } from "./useWalletModal";

const styles = {
  wallet_adapter_button_trigger: `bg-stone-400 text-stone-800 border-0 py-3 px-5 text-xl rounded-full`,
};

export const WalletModalButton: FunctionalComponent<ButtonProps> = ({
  children = "Select Wallet",
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
      id="wallet-modal-button"
      className={styles.wallet_adapter_button_trigger}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};
