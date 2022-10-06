import { h, ComponentChildren, FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { WalletModalContext } from './useWalletModal';
import type { WalletModalProps } from './WalletModal';
import { WalletModal } from './WalletModal';

export interface WalletModalProviderProps extends WalletModalProps {
  children: ComponentChildren;
}

export const WalletModalProvider: FunctionalComponent<
  WalletModalProviderProps
> = ({ children, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <WalletModalContext.Provider
      value={{
        visible,
        setVisible,
      }}
    >
      {children}
      {visible && <WalletModal {...props} />}
    </WalletModalContext.Provider>
  );
};
