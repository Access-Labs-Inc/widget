import tw from "twin.macro";
import { h } from "preact";
import { Check, Circle } from "phosphor-react";

const styles = {
  stepRoot: tw`flex items-center`,
  completedIconWrap: tw`relative ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500`,
  completedIcon: tw`h-full w-full text-stone-600 font-bold`,
  completedText: tw`ml-3 text-xl font-medium text-green-500  text-green-500`,
  currentIcon: tw`ml-1 h-6 w-6 animate-spin text-indigo-500`,
  currentText: tw`ml-3 text-xl font-medium text-indigo-600`,
  pendingIconWrap: tw`relative ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-500`,
  pendingIcon: tw`h-full w-full text-stone-800`,
  pendingText: tw`ml-3 text-xl font-bold text-stone-600`,
};

const Completed = ({ name }: { name: string }) => (
  <span className="group">
    <span css={styles.stepRoot}>
      <span css={styles.completedIconWrap}>
        <Check css={styles.completedIcon} aria-hidden="true" />
      </span>
      <span css={styles.completedText}>{name}</span>
    </span>
  </span>
);

const Current = ({ name }: { name: string }) => (
  <span css={styles.stepRoot} aria-current="step">
    <svg
      css={styles.currentIcon}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        css={tw`opacity-25`}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        css={tw`opacity-75`}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span css={styles.currentText}>{name}</span>
  </span>
);

const Pending = ({ name }: { name: string }) => (
  <span className="group">
    <span css={styles.stepRoot}>
      <span css={styles.pendingIconWrap}>
        <Circle css={styles.pendingIcon} aria-hidden="true" />
      </span>
      <span css={styles.pendingText}>{name}</span>
    </span>
  </span>
);

export const ProgressStep = ({
  name,
  status,
}: {
  name: string;
  status: string;
}) => {
  let component = null;
  switch (status) {
    case "complete":
      component = <Completed name={name} />;
      break;
    case "current":
      component = <Current name={name} />;
      break;
    case "pending":
    default:
      component = <Pending name={name} />;
      break;
  }

  return <li key={name}>{component}</li>;
};
