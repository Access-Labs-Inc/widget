import { h, ComponentChildren } from "preact";
import { useState, useMemo, useCallback, useContext } from "preact/hooks";
import { Copy, ArrowUpRight } from "phosphor-react";
import { ConfigContext } from "../AppContext";

import { useWallet } from "./wallet-adapter/useWallet";

const styles = {
  header_dropdown_copy: `flex items-center cursor-pointer`,
  header_copy_text_wrap: `flex items-center cursor-pointer`,
  header_copy_text: `flex items-center cursor-pointer`,
  header_copy_text_base58: `mr-2`,
  header_copied_text: `flex items-center cursor-pointer text-green-400`,
  header_explorer: `mx-1 text-white no-underline`,
  header_content: `flex items-center justify-between`,
};

export const Header = ({ children }: { children: ComponentChildren }) => {
  const { classPrefix } = useContext(ConfigContext);
  const [copied, setCopied] = useState(false);
  const { publicKey } = useWallet();

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const shortBase58 = useMemo(() => {
    if (!base58) {
      return null;
    }
    return `${base58.slice(0, 4)}..${base58.slice(-4)}`;
  }, [base58]);
  const copyAddress = useCallback(async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 400);
    }
  }, [base58]);

  return (
    <div className={styles.header_content}>
      <div onClick={copyAddress} className={styles.header_dropdown_copy}>
        {copied ? (
          <div className={styles.header_copied_text}>Copied!</div>
        ) : (
          <div className={styles.header_copy_text_wrap}>
            <div className={styles.header_copy_text}>
              <div className={styles.header_copy_text_base58}>
                {shortBase58}
              </div>
              <Copy color="white" />
            </div>
            <a
              className={styles.header_explorer}
              href={`https://explorer.solana.com/address/${base58}`}
              rel="nofollow noopener"
              target="_blank"
            >
              <ArrowUpRight color="white" />
            </a>
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
