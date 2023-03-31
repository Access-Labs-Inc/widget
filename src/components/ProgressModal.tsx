import { Fragment, h } from "preact";

import { RouteLink } from "../layout/Router";

import { ProgressStep } from "./ProgressStep";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../AppContext";

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
    return "complete";
  }
  if (stepIndex === currentStepIndex) {
    return "current";
  }
  return "";
};

const styles = {
  button: `w-full rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-stone-700 border-0`,
  title: `my-8 mt-16 text-white text-2xl text-center`,
  subtitle: `text-white text-center text-stone-400`,
  steps: `flex flex-col justify-start my-4`,
  stepsList: `space-y-4 list-none mb-10`,
  disabledButtonStyles: `bg-stone-600 cursor-not-allowed`,
};

// const hoverButtonStyles = css`
//   &:hover {
//     ${`bg-indigo-300 text-stone-800`}
//   }
// `;

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
      <div className={styles.title}>Steps to complete</div>
      <div className={styles.subtitle}>
        We need you to sign these
        <br /> transactions to stake
      </div>
      <nav className={styles.steps} aria-label="Progress">
        <ol className={styles.stepsList}>
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
          href="/"
          className={[
            styles.button,
            working !== doneStepName
              ? styles.disabledButtonStyles
              : "hoverButtonStyles",
          ]}
        >
          Close
        </RouteLink>
      </nav>
    </Fragment>
  );
};

export { ProgressModal };
