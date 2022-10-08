import { h } from 'preact';
import type { Wallet } from '@solana/wallet-adapter-react';
import type { FunctionalComponent } from 'preact';
import tw from 'twin.macro';

export interface WalletIconProps {
  wallet: Wallet | null;
}

const styles = {
  wallet_adapter_wallet_icon: tw`w-8 h-8 mr-8`,
};

export const WalletIcon: FunctionalComponent<WalletIconProps> = ({
  wallet,
  ...props
}) => {
  return (
    wallet && (
      <img
        src={wallet.adapter.icon}
        alt={`${wallet.adapter.name} icon`}
        css={styles.wallet_adapter_wallet_icon}
        {...props}
      />
    )
  );
};
