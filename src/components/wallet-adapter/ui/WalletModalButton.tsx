import { type FunctionalComponent, h } from "preact";
import { useCallback, useContext } from "preact/hooks";
import { ConfigContext } from "../../../AppContext";
import { clsxp } from "../../../libs/utils";
import type { ButtonProps } from "./Button";
import { Button } from "./Button";
import { useWalletModal } from "./useWalletModal";

export const WalletModalButton: FunctionalComponent<ButtonProps> = ({
  children = "Select Wallet",
  onClick,
  ...props
}) => {
  const { classPrefix } = useContext(ConfigContext);
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
      className={clsxp(classPrefix, "wallet_adapter_button_trigger")}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};
