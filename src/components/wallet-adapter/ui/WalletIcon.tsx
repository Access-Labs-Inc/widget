import { h } from "preact";
import type { Wallet } from "@solana/wallet-adapter-react";
import type { FunctionalComponent } from "preact";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../../../AppContext";
import { clsxp } from "../../../libs/utils";

export interface WalletIconProps {
  wallet: Wallet | null;
}

export const WalletIcon: FunctionalComponent<WalletIconProps> = ({
  wallet,
  ...props
}) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    wallet && (
      <img
        src={wallet.adapter.icon}
        alt={`${wallet.adapter.name} icon`}
        className={clsxp(classPrefix, "wallet_adapter_wallet_icon")}
        {...props}
      />
    )
  );
};
