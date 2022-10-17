import { h } from 'preact';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import type { Wallet } from '../useWallet';
import type { FunctionalComponent } from 'preact';

import { Button } from './Button';
import { WalletIcon } from './WalletIcon';
import tw from 'twin.macro';

export interface WalletListItemProps {
  handleClick: any;
  tabIndex?: number;
  wallet: Wallet;
}

const styles = {
  wallet_list_item: tw`text-white w-full text-left mt-4 text-xl bg-stone-700 rounded-full font-normal py-3 px-6`,
};

export const WalletListItem: FunctionalComponent<WalletListItemProps> = ({
  handleClick,
  tabIndex,
  wallet,
}) => {
  return (
    <li>
      <Button
        cssClass={styles.wallet_list_item}
        onClick={handleClick}
        startIcon={<WalletIcon wallet={wallet} />}
        tabIndex={tabIndex}
      >
        {wallet.adapter.name}
      </Button>
    </li>
  );
};
