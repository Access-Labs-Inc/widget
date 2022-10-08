import { FunctionalComponent, h } from 'preact';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { createPortal, Fragment } from 'preact/compat';

import type { WalletName } from '@solana/wallet-adapter-base';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet, type Wallet } from '../useWallet';

import { Collapse } from './Collapse';
import { useWalletModal } from './useWalletModal';
import { WalletListItem } from './WalletListItem';
import { WalletSVG } from './WalletSVG';
import tw from 'twin.macro';

export interface WalletModalProps {
  className?: string;
  container?: string;
}

const styles = {
  wallet_adapter_modal_title: tw`text-2xl font-sans font-semibold text-center pb-10 px-10`,
  wallet_adapter_modal: tw`absolute left-0 top-12 text-white`,
  wallet_adapter_modal_wrapper: tw`relative flex flex-col items-center justify-center pb-10`,
  wallet_adapter_modal_container: tw`rounded-[1rem] bg-gray-800 p-3 content-center items-center`,
  wallet_adapter_modal_button_close: tw`absolute top-4 right-4 p-3 cursor-pointer bg-gray-800 border-0 fill-[#fff]`,
};

export const WalletModal: FunctionalComponent<WalletModalProps> = ({
  className = '',
  container = '#acs',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { wallets, select } = useWallet();
  const { setVisible } = useWalletModal();
  const [expanded, setExpanded] = useState(false);
  const [portal, setPortal] = useState<Element | null>(null);

  const [installedWallets, otherWallets] = useMemo(() => {
    const installed: Wallet[] = [];
    const notDetected: Wallet[] = [];
    const loadable: Wallet[] = [];

    for (const wallet of wallets) {
      if (wallet.readyState === WalletReadyState.NotDetected) {
        notDetected.push(wallet);
      } else if (wallet.readyState === WalletReadyState.Loadable) {
        loadable.push(wallet);
      } else if (wallet.readyState === WalletReadyState.Installed) {
        installed.push(wallet);
      }
    }

    return [installed, [...loadable, ...notDetected]];
  }, [wallets]);

  const getStartedWallet = useMemo(() => {
    return installedWallets.length
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        installedWallets[0]!
      : wallets.find(
          (wallet: { adapter: { name: WalletName } }) =>
            wallet.adapter.name === 'Torus'
        ) ||
          wallets.find(
            (wallet: { adapter: { name: WalletName } }) =>
              wallet.adapter.name === 'Phantom'
          ) ||
          wallets.find(
            (wallet: { readyState: any }) =>
              wallet.readyState === WalletReadyState.Loadable
          ) ||
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          otherWallets[0]!;
  }, [installedWallets, wallets, otherWallets]);

  const hideModal = useCallback(() => {
    setTimeout(() => setVisible(false), 150);
  }, [setVisible]);

  const handleClose = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      hideModal();
    },
    [hideModal]
  );

  const handleWalletClick = useCallback(
    (event: MouseEvent, walletName: WalletName) => {
      select(walletName);
      handleClose(event);
    },
    [select, handleClose]
  );

  const handleCollapseClick = useCallback(
    () => setExpanded(!expanded),
    [expanded]
  );

  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
      const node = ref.current;
      if (!node) return;

      // here we query all focusable elements
      const focusableElements = node.querySelectorAll('button');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const firstElement = focusableElements[0]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastElement = focusableElements[focusableElements.length - 1]!;

      if (event.shiftKey) {
        // if going backward by pressing tab and firstElement is active, shift focus to last focusable element
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        // if going forward by pressing tab and lastElement is active, shift focus to first focusable element
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    },
    [ref]
  );

  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideModal();
      } else if (event.key === 'Tab') {
        handleTabKey(event);
      }
    };

    // Get original overflow
    const { overflow } = window.getComputedStyle(document.body);
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';
    // Listen for keydown events
    window.addEventListener('keydown', handleKeyDown, false);

    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [hideModal, handleTabKey]);

  useLayoutEffect(
    () => setPortal(document.querySelector(container)),
    [container]
  );

  return (
    portal &&
    createPortal(
      <div
        aria-labelledby="wallet-adapter-modal-title"
        aria-modal="true"
        css={[styles.wallet_adapter_modal, className]}
        ref={ref}
        role="dialog"
      >
        <div css={styles.wallet_adapter_modal_container}>
          <div css={styles.wallet_adapter_modal_wrapper}>
            {installedWallets.length ? (
              <Fragment>
                <h1 css={styles.wallet_adapter_modal_title}>
                  Connect your wallet
                </h1>
                <ul className="wallet-adapter-modal-list">
                  {installedWallets.map((wallet) => (
                    <WalletListItem
                      key={wallet.adapter.name}
                      handleClick={(event: MouseEvent) =>
                        handleWalletClick(event, wallet.adapter.name)
                      }
                      wallet={wallet}
                    />
                  ))}
                  {otherWallets.length ? (
                    <Collapse
                      expanded={expanded}
                      id="wallet-adapter-modal-collapse"
                    >
                      {otherWallets.map((wallet) => (
                        <WalletListItem
                          key={wallet.adapter.name}
                          handleClick={(event: MouseEvent) =>
                            handleWalletClick(event, wallet.adapter.name)
                          }
                          tabIndex={expanded ? 0 : -1}
                          wallet={wallet}
                        />
                      ))}
                    </Collapse>
                  ) : null}
                </ul>
                {otherWallets.length ? (
                  <button
                    className="wallet-adapter-modal-list-more"
                    onClick={handleCollapseClick}
                    tabIndex={0}
                  >
                    <span>{expanded ? 'Less ' : 'More '}options</span>
                    <svg
                      width="13"
                      height="7"
                      viewBox="0 0 13 7"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${
                        expanded
                          ? 'wallet-adapter-modal-list-more-icon-rotate'
                          : ''
                      }`}
                    >
                      <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                    </svg>
                  </button>
                ) : null}
              </Fragment>
            ) : (
              <Fragment>
                <h1 className="wallet-adapter-modal-title">
                  You'll need a wallet on Solana to continue
                </h1>
                <div className="wallet-adapter-modal-middle">
                  <WalletSVG />
                  <button
                    type="button"
                    className="wallet-adapter-modal-middle-button"
                    onClick={(event: MouseEvent) =>
                      handleWalletClick(event, getStartedWallet.adapter.name)
                    }
                  >
                    Get started
                  </button>
                </div>
                {otherWallets.length ? (
                  <Fragment>
                    <button
                      className="wallet-adapter-modal-list-more"
                      onClick={handleCollapseClick}
                      tabIndex={0}
                    >
                      <span>
                        {expanded ? 'Hide ' : 'Already have a wallet? View '}
                        options
                      </span>
                      <svg
                        width="13"
                        height="7"
                        viewBox="0 0 13 7"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`${
                          expanded
                            ? 'wallet-adapter-modal-list-more-icon-rotate'
                            : ''
                        }`}
                      >
                        <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                      </svg>
                    </button>
                    <Collapse
                      expanded={expanded}
                      id="wallet-adapter-modal-collapse"
                    >
                      <ul className="wallet-adapter-modal-list">
                        {otherWallets.map((wallet) => (
                          <WalletListItem
                            key={wallet.adapter.name}
                            handleClick={(event: MouseEvent) =>
                              handleWalletClick(event, wallet.adapter.name)
                            }
                            tabIndex={expanded ? 0 : -1}
                            wallet={wallet}
                          />
                        ))}
                      </ul>
                    </Collapse>
                  </Fragment>
                ) : null}
              </Fragment>
            )}
          </div>
        </div>
        <div
          className="wallet-adapter-modal-overlay"
          onMouseDown={handleClose}
        />
      </div>,
      portal
    )
  );
};
