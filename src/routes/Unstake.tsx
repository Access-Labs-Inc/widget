import { h } from "preact";

import { Header } from "../components/Header";
import { RouteLink } from "../layout/Router";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../AppContext";
import env from "../libs/env";

const styles = {
  root: `h-[31em] flex flex-col justify-between`,
  cancel_link: `self-end cursor-pointer text-blue-400 no-underline`,
  button: `w-full block rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-stone-700`,
  title: `text-white text-2xl text-center`,
  subtitle: `text-white text-center text-stone-400 my-14`,
  footnote: `flex justify-center text-sm text-indigo-500 mt-2 mb-2`,
};

// const hoverButtonStyles = css`
//   &:hover {
//     ${tw`bg-indigo-300 text-stone-800`}
//   }
// `;

export const Unstake = () => {
  const { poolId } = useContext(ConfigContext);

  return (
    <div className={styles.root}>
      <Header>
        <RouteLink href="/" css={styles.cancel_link}>
          Cancel
        </RouteLink>
      </Header>

      <div className={styles.title}>Unlock ACS</div>
      <div className={styles.subtitle}>
        ACS unlocking is currently only possible in the access app.
      </div>

      <div>
        <a
          className={[styles.button, "hoverButtonStyles"].join(" ")}
          href={`${env.UNSTAKE_BASE_URL}/${poolId}`}
          target="_blank"
          rel="noopener"
        >
          Unlock ACS on access
        </a>

        <div className={styles.footnote}>
          This will direct you to accessprotocol.co
        </div>
      </div>
    </div>
  );
};
