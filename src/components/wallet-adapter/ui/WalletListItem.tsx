import { h } from "preact";
import type { Wallet } from "../useWallet";
import type { FunctionalComponent } from "preact";

import { Button } from "./Button";
import { WalletIcon } from "./WalletIcon";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../../../AppContext";
import { clsxp } from "../../../libs/utils";

export interface WalletListItemProps {
  handleClick: (e: MouseEvent) => void;
  tabIndex?: number;
  wallet: Wallet;
}

export const WalletListItem: FunctionalComponent<WalletListItemProps> = ({
  handleClick,
  tabIndex,
  wallet,
}) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <li>
      <Button
        className={clsxp(classPrefix, "wallet_list_item")}
        onClick={handleClick}
        startIcon={<WalletIcon wallet={wallet} />}
        tabIndex={tabIndex}
      >
        {wallet.adapter.name}
      </Button>
    </li>
  );
};
