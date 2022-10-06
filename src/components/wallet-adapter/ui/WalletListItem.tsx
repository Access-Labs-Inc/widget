import { h } from 'preact';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import type { Wallet } from '../useWallet';
import type { FunctionalComponent } from 'preact';

import { Button } from './Button';
import { WalletIcon } from './WalletIcon';

export interface WalletListItemProps {
  handleClick: any;
  tabIndex?: number;
  wallet: Wallet;
}

export const WalletListItem: FunctionalComponent<WalletListItemProps> = ({
  handleClick,
  tabIndex,
  wallet,
}) => {
  return (
    <li>
      <Button
        onClick={handleClick}
        startIcon={<WalletIcon wallet={wallet} />}
        tabIndex={tabIndex}
      >
        {wallet.adapter.name}
        {wallet.readyState === WalletReadyState.Installed && (
          <span>Detected</span>
        )}
      </Button>
    </li>
  );
};
