import { h } from "preact";
import { Check, Circle } from "phosphor-react";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../AppContext";

const styles = {
  stepRoot: `flex items-center`,
  completedIconWrap: `relative ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500`,
  completedIcon: `h-full w-full text-stone-600 font-bold`,
  completedText: `ml-3 text-xl font-medium text-green-500  text-green-500`,
  currentIcon: `ml-1 h-6 w-6 animate-spin text-indigo-500`,
  currentText: `ml-3 text-xl font-medium text-indigo-600`,
  pendingIconWrap: `relative ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-500`,
  pendingIcon: `h-full w-full text-stone-800`,
  pendingText: `ml-3 text-xl font-bold text-stone-600`,
};

const Completed = ({ name }: { name: string }) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <span className="group">
      <span className={styles.stepRoot}>
        <span className={styles.completedIconWrap}>
          <Check className={styles.completedIcon} aria-hidden="true" />
        </span>
        <span className={styles.completedText}>{name}</span>
      </span>
    </span>
  );
};

const Current = ({ name }: { name: string }) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <span className={styles.stepRoot} aria-current="step">
      <svg
        className={styles.currentIcon}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className={`opacity-25`}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className={`opacity-75`}
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className={styles.currentText}>{name}</span>
    </span>
  );
};

const Pending = ({ name }: { name: string }) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <span className="group">
      <span className={styles.stepRoot}>
        <span className={styles.pendingIconWrap}>
          <Circle className={styles.pendingIcon} aria-hidden="true" />
        </span>
        <span className={styles.pendingText}>{name}</span>
      </span>
    </span>
  );
};

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
