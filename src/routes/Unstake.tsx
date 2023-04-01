import { h } from 'preact';

import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';
import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import env from '../libs/env';
import clsx from 'clsx';
import { clsxp } from '../libs/utils';

export const Unstake = () => {
  const { poolId, classPrefix } = useContext(ConfigContext);

  return (
    <div className={clsxp(classPrefix, 'unstake_root')}>
      <Header>
        <RouteLink
          href='/'
          className={clsx(classPrefix, 'unstake_cancel_link')}
        >
          Cancel
        </RouteLink>
      </Header>

      <div className={clsxp(classPrefix, 'unstake_title')}>Unlock ACS</div>
      <div className={clsxp(classPrefix, 'unstake_subtitle')}>
        ACS unlocking is currently only possible in the access app.
      </div>

      <div>
        <a
          className={clsxp(classPrefix, 'unstake_button')}
          href={`${env.UNSTAKE_BASE_URL}/${poolId}`}
          target='_blank'
          rel='noopener'
        >
          Unlock ACS on access
        </a>

        <div className={clsxp(classPrefix, 'unstake_footnote')}>
          This will direct you to accessprotocol.co
        </div>
      </div>
    </div>
  );
};
