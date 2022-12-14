import tw, { css } from 'twin.macro';
import { h } from 'preact';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';

const styles = {
  root: tw`h-[31em] flex flex-col justify-between`,
  cancel_link: tw`self-end cursor-pointer text-blue-400 no-underline`,
  button: tw`w-full block rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-stone-700`,
  title: tw`text-white text-2xl text-center`,
  subtitle: tw`text-white text-center text-stone-400 my-14`,
  footnote: tw`flex justify-center text-sm text-indigo-500 mt-2 mb-2`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-300 text-stone-800`}
  }
`;

export const Unstake = () => {
  const { poolId } = useContext(ConfigContext);

  return (
    <div css={styles.root}>
      <Header>
        <RouteLink href='/' css={styles.cancel_link}>
          Cancel
        </RouteLink>
      </Header>

      <div css={styles.title}>Unstake ACS</div>
      <div css={styles.subtitle}>
        Unstake is currently only possible on the access app.
      </div>

      <div>
        <a
          css={[styles.button, hoverButtonStyles]}
          href={`https://st-app.accessprotocol.co/creators/${poolId}`}
          target='_blank'
          rel='noopener'
        >
          Unstake on access
        </a>

        <div css={styles.footnote}>
          This will direct you to accessprotocol.co
        </div>
      </div>
    </div>
  );
};
