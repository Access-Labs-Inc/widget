import { Fragment, h } from 'preact';

import { RouteLink } from '../layout/Router';

import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import { clsxp } from '../libs/utils';
import Loading from "./Loading";

const ProgressModal = ({
  working,
  doneStepName,
}: {
  working: string;
  doneStepName: string;
}) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <Fragment>
      <div className={clsxp(classPrefix, 'process_modal_title')}>
        Sign a transaction
      </div>
      <div className={clsxp(classPrefix, 'process_modal_subtitle')}>
        We need you to sign a transaction to lock your funds.
      </div>
      <nav
        className={clsxp(classPrefix, 'process_modal_steps')}
        aria-label='Progress'
      >
        <div className={clsxp(classPrefix, 'process_modal_steps_load')}>
        <Loading />
        </div>
        <RouteLink
          disabled={working !== doneStepName}
          href='/'
          className={clsxp(
            classPrefix,
            'process_modal_button',
            working !== doneStepName
              ? 'process_modal_button_disabled'
              : 'process_modal_button_selected'
          )}
        >
          Close
        </RouteLink>
      </nav>
    </Fragment>
  );
};

export { ProgressModal };
