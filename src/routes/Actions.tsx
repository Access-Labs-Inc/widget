import tw, { css } from 'twin.macro';
import { h } from 'preact';
import { RouteLink } from '../layout/Router';
import { Header } from '../components/Header';
import { useWallet } from '../components/wallet-adapter/useWallet';
import { useEffect, useState } from 'preact/hooks';
import { useConnection } from '../components/wallet-adapter/useConnection';
import { getUserACSBalance } from '../libs/program';
import BN from 'bn.js';

const styles = {
  links_wrapper: tw`block my-4 flex flex-col gap-3`,
  actions_disconnect: tw`self-end cursor-pointer text-red-400 no-underline`,
  logo: tw`my-6 flex items-center justify-center`,
  button: tw`rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center text-indigo-500 bg-gray-700`,
  balance: tw`text-xl text-white text-center`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-500 text-gray-800`}
  }
`;

export const Actions = () => {
  const { connection } = useConnection();
  const { publicKey, disconnect } = useWallet();
  const [balance, setBalance] = useState<BN | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    (async () => {
      const balance = await getUserACSBalance(connection, publicKey);
      setBalance(balance);
    })();
  }, [publicKey, connection]);

  return (
    <div>
      <Header>
        <div onClick={disconnect} css={styles.actions_disconnect}>
          Disconnect
        </div>
      </Header>

      <div css={styles.logo}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.8221 47.17C30.5621 47.17 37.1321 43.48 40.1021 36.28V46H47.9321V24.13C47.9321 9.91 38.2121 0.369997 24.2621 0.369997C10.1321 0.369997 0.23207 10.18 0.23207 24.13C0.23207 38.8 11.2121 47.17 22.8221 47.17ZM24.1721 39.25C14.9921 39.25 8.87207 32.77 8.87207 23.77C8.87207 14.77 14.9921 8.29 24.1721 8.29C33.3521 8.29 39.4721 14.77 39.4721 23.77C39.4721 32.77 33.3521 39.25 24.1721 39.25Z"
            fill="#E7E5E4"
          />
        </svg>
      </div>

      {balance && (
        <div css={styles.balance}>{balance.toNumber()} ACS available</div>
      )}
      <div css={styles.links_wrapper}>
        <RouteLink css={[styles.button, hoverButtonStyles]} href="/stake">
          Stake
        </RouteLink>
        <RouteLink css={[styles.button, hoverButtonStyles]} href="/">
          Unstake
        </RouteLink>
        <RouteLink css={[styles.button, hoverButtonStyles]} href="/">
          Claim
        </RouteLink>
      </div>
    </div>
  );
};
