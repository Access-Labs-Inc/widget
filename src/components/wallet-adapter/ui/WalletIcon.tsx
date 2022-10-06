import { h } from 'preact';
import type { Wallet } from '@solana/wallet-adapter-react';
import type { FunctionalComponent } from 'preact';

export interface WalletIconProps {
  wallet: Wallet | null;
}

export const WalletIcon: FunctionalComponent<WalletIconProps> = ({
  wallet,
  ...props
}) => {
  return (
    wallet && (
      <img
        src={wallet.adapter.icon}
        alt={`${wallet.adapter.name} icon`}
        {...props}
      />
    )
  );
};
