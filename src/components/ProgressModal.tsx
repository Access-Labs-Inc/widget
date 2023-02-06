import tw, { css } from "twin.macro";
import { Fragment, h } from "preact";

import { RouteLink } from "../layout/Router";

import { ProgressStep } from "./ProgressStep";

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
  button: tw`w-full rounded-full cursor-pointer no-underline font-bold py-4 block text-xl text-center bg-indigo-500 text-stone-700 border-0`,
  title: tw`my-8 mt-16 text-white text-2xl text-center`,
  subtitle: tw`text-white text-center text-stone-400`,
  steps: tw`flex flex-col justify-start my-4`,
  stepsList: tw`space-y-4 list-none mb-10`,
  disabledButtonStyles: tw`bg-stone-600 cursor-not-allowed`,
};

const hoverButtonStyles = css`
  &:hover {
    ${tw`bg-indigo-300 text-stone-800`}
  }
`;

const ProgressModal = ({
  working,
  stepOrder,
  doneStepName,
}: {
  working: string;
  stepOrder: string[];
  doneStepName: string;
}) => {
  return (
    <Fragment>
      <div css={styles.title}>Steps to complete</div>
      <div css={styles.subtitle}>
        We need you to sign these
        <br /> transactions to stake
      </div>
      <nav css={styles.steps} aria-label="Progress">
        <ol css={styles.stepsList}>
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
          css={[
            styles.button,
            working !== doneStepName
              ? styles.disabledButtonStyles
              : hoverButtonStyles,
          ]}
        >
          Close
        </RouteLink>
      </nav>
    </Fragment>
  );
};

export { ProgressModal };
