import { h, ComponentChildren } from 'preact';
import { useState, useMemo, useCallback, useContext } from 'preact/hooks';
import { Copy, ArrowUpRight } from 'phosphor-react';
import { ConfigContext } from '../AppContext';

import { useWallet } from './wallet-adapter/useWallet';
import { clsxp } from '../libs/utils';

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
    <div className={clsxp(classPrefix, 'header_content')}>
      <div
        onClick={copyAddress}
        className={clsxp(classPrefix, 'header_dropdown_copy')}
      >
        {copied ? (
          <div className={clsxp(classPrefix, 'header_copied_text')}>
            Copied!
          </div>
        ) : (
          <div className={clsxp(classPrefix, 'header_copy_text_wrap')}>
            <div className={clsxp(classPrefix, 'header_copy_text')}>
              <div className={clsxp(classPrefix, 'header_copy_text_base58')}>
                {shortBase58}
              </div>
              <Copy color='white' />
            </div>
            <a
              className={clsxp(classPrefix, 'header_explorer')}
              href={`https://explorer.solana.com/address/${base58}`}
              rel='nofollow noopener'
              target='_blank'
            >
              <ArrowUpRight color='white' />
            </a>
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
