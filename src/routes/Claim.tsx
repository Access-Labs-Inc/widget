import tw, { css } from 'twin.macro';
import { h } from 'preact';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';

const styles = {
  cancel_link: tw`self-end cursor-pointer text-blue-400 no-underline`,
  button: tw`w-full block rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-gray-700`,
  title: tw`my-8 mt-16 text-white text-2xl text-center`,
  subtitle: tw`text-white text-center text-gray-400 my-14`,
  footnote: tw`flex justify-center text-sm text-indigo-500 mt-8 mb-2`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-300 text-gray-800`}
  }
`;

export const Claim = () => {
  const { poolId } = useContext(ConfigContext);

  return (
    <div>
      <Header>
        <RouteLink href="/" css={styles.cancel_link}>
          Cancel
        </RouteLink>
      </Header>

      <div css={styles.title}>Claim ACS</div>
      <div css={styles.subtitle}>
        Claim is currently only possible on the access app.
      </div>

      <a
        css={[styles.button, hoverButtonStyles]}
        href={`https://st-app.accessprotocol.co/creators/${poolId}`}
        target="_blank"
        rel="noopener"
      >
        Claim on access
      </a>

      <div css={styles.footnote}>This will direct you to accessprotocol.co</div>
    </div>
  );
};
