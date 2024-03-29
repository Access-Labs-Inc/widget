import { FunctionalComponent, h } from "preact";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { createPortal, Fragment } from "preact/compat";

import type { WalletName } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet, type Wallet } from "../useWallet";

import { Collapse } from "./Collapse";
import { useWalletModal } from "./useWalletModal";
import { WalletListItem } from "./WalletListItem";
import { ConfigContext } from "../../../AppContext";
import { clsxp } from "../../../libs/utils";

export interface WalletModalProps {
  className?: string;
  container?: string;
}

export const WalletModal: FunctionalComponent<WalletModalProps> = ({
  className = "",
  container = "#wallet-modal-button",
}) => {
  const { classPrefix } = useContext(ConfigContext);
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
      ? installedWallets[0]
      : wallets.find(
          (wallet: { adapter: { name: WalletName } }) =>
            wallet.adapter.name === "Torus"
        ) ||
          wallets.find(
            (wallet: { adapter: { name: WalletName } }) =>
              wallet.adapter.name === "Phantom"
          ) ||
          wallets.find(
            (wallet: { readyState: WalletReadyState }) =>
              wallet.readyState === WalletReadyState.Loadable
          ) ||
          otherWallets[0];
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
      const focusableElements = node.querySelectorAll("button");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const firstElement = focusableElements[0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastElement = focusableElements[focusableElements.length - 1];

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

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const node = ref.current;

      // Do nothing if clicking dropdown or its descendants
      if (!node || node.contains(event.target as Node)) return;

      hideModal();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, hideModal]);

  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideModal();
      } else if (event.key === "Tab") {
        handleTabKey(event);
      }
    };

    // Get original overflow
    const { overflow } = window.getComputedStyle(document.body);
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Listen for keydown events
    window.addEventListener("keydown", handleKeyDown, false);

    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [hideModal, handleTabKey]);

  useLayoutEffect(() => {
    const containerEl = document.querySelector(container);
    const portalEl = document.createElement("div");
    if (containerEl?.parentNode && portalEl)
      containerEl.parentNode.insertBefore(
        portalEl,
        containerEl.nextElementSibling
      );
    setPortal(portalEl);
  }, [container]);

  return (
    portal &&
    createPortal(
      <div
        aria-labelledby="wallet-adapter-modal-title"
        aria-modal="true"
        className={clsxp(classPrefix, "wallet_adapter_modal", className)}
        ref={ref}
        role="dialog"
      >
        <div className={clsxp(classPrefix, "wallet_adapter_modal_container")}>
          <div className={clsxp(classPrefix, "wallet_adapter_modal_wrapper")}>
            {installedWallets.length ? (
              <Fragment>
                <h1
                  className={clsxp(classPrefix, "wallet_adapter_modal_title")}
                >
                  Connect your wallet
                </h1>
                <p
                  className={clsxp(
                    classPrefix,
                    "wallet_adapter_modal_title_para"
                  )}
                >
                  You need a Solana wallet to
                  <br /> connect to the website.
                </p>
                <ul className={clsxp(classPrefix, "wallet_adapter_modal_list")}>
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
                    className={clsxp(
                      classPrefix,
                      "wallet_adapter_modal_list_more"
                    )}
                    onClick={handleCollapseClick}
                    tabIndex={0}
                  >
                    <span>{expanded ? "Less " : "More "}options</span>
                    <svg
                      width="13"
                      height="7"
                      viewBox="0 0 13 7"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="white"
                      className={
                        expanded
                          ? clsxp(
                              classPrefix,
                              "wallet_adapter_modal_list_more_icon_rotate_expanded"
                            )
                          : clsxp(
                              classPrefix,
                              "wallet_adapter_modal_list_more_icon_rotate"
                            )
                      }
                    >
                      <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                    </svg>
                  </button>
                ) : null}
              </Fragment>
            ) : (
              <Fragment>
                <h1
                  className={clsxp(classPrefix, "wallet_adapter_modal_title")}
                >
                  You'll need a wallet
                </h1>
                <div
                  className={clsxp(classPrefix, "wallet_adapter_modal_middle")}
                >
                  <button
                    type="button"
                    className={clsxp(
                      classPrefix,
                      "wallet_adapter_modal_middle_button"
                    )}
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
                      className={clsxp(
                        classPrefix,
                        "wallet_adapter_modal_list_more"
                      )}
                      onClick={handleCollapseClick}
                      tabIndex={0}
                    >
                      <span>
                        {expanded ? "Hide " : "Already have a wallet? View "}
                        options
                      </span>
                      <svg
                        width="13"
                        height="7"
                        viewBox="0 0 13 7"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="white"
                        className={
                          expanded
                            ? clsxp(
                                classPrefix,
                                "wallet_adapter_modal_list_more_icon_rotate_expanded"
                              )
                            : clsxp(
                                classPrefix,
                                "wallet_adapter_modal_list_more_icon_rotate"
                              )
                        }
                      >
                        <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                      </svg>
                    </button>
                    <Collapse
                      expanded={expanded}
                      id="wallet-adapter-modal-collapse"
                    >
                      <ul
                        className={clsxp(
                          classPrefix,
                          "wallet_adapter_modal_list"
                        )}
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
                      </ul>
                    </Collapse>
                  </Fragment>
                ) : null}
              </Fragment>
            )}
          </div>
        </div>
      </div>,
      portal
    )
  );
};
