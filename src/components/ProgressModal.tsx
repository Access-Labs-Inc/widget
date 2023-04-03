import { Fragment, h } from 'preact';

import { RouteLink } from '../layout/Router';

import { ProgressStep } from './ProgressStep';
import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import { clsxp } from '../libs/utils';

const getStepState = (
  current: string,
  step: string,
  stepOrder: string[],
  doneStep: string
) => {
  // find if the step is before, current, or after the current step;
  const currentStepIndex = stepOrder.indexOf(current);
  const stepIndex = stepOrder.indexOf(step);
  if (stepIndex < currentStepIndex || current === doneStep) {
    return 'complete';
  }
  if (stepIndex === currentStepIndex) {
    return 'current';
  }
  return '';
};

const ProgressModal = ({
  working,
  stepOrder,
  doneStepName,
}: {
  working: string;
  stepOrder: string[];
  doneStepName: string;
}) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <Fragment>
      <div className={clsxp(classPrefix, 'process_modal_title')}>
        Steps to complete
      </div>
      <div className={clsxp(classPrefix, 'process_modal_subtitle')}>
        We need you to sign these
        <br /> transactions to stake
      </div>
      <nav
        className={clsxp(classPrefix, 'process_modal_steps')}
        aria-label='Progress'
      >
        <ol className={clsxp(classPrefix, 'process_modal_steps_list')}>
          {stepOrder.map((step) => (
            <ProgressStep
              name={step}
              key={step}
              status={getStepState(working, step, stepOrder, doneStepName)}
            />
          ))}
        </ol>
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
