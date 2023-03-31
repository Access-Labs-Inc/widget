import { h } from "preact";
import type { Wallet } from "../useWallet";
import type { FunctionalComponent } from "preact";

import { Button } from "./Button";
import { WalletIcon } from "./WalletIcon";

export interface WalletListItemProps {
  handleClick: (e: MouseEvent) => void;
  tabIndex?: number;
  wallet: Wallet;
}

const styles = {
  wallet_list_item: `text-white w-full text-left mt-4 text-xl bg-stone-700 rounded-full font-normal py-3 px-6`,
};

export const WalletListItem: FunctionalComponent<WalletListItemProps> = ({
  handleClick,
  tabIndex,
  wallet,
}) => {
  return (
    <li>
      <Button
        className={styles.wallet_list_item}
        onClick={handleClick}
        startIcon={<WalletIcon wallet={wallet} />}
        tabIndex={tabIndex}
      >
        {wallet.adapter.name}
      </Button>
    </li>
  );
};
