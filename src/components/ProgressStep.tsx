import { h } from "preact";
import { Check, Circle } from "phosphor-react";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../AppContext";
import { clsxp } from "../libs/utils";

const Completed = ({ name }: { name: string }) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <span className="group">
      <span className={clsxp(classPrefix, "process_step_root")}>
        <span
          className={clsxp(classPrefix, "process_step_completed_icon_wrap")}
        >
          <Check
            className={clsxp(classPrefix, "process_step_completed_icon")}
            aria-hidden="true"
          />
        </span>
        <span className={clsxp(classPrefix, "process_step_completed_text")}>
          {name}
        </span>
      </span>
    </span>
  );
};

const Current = ({ name }: { name: string }) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <span
      className={clsxp(classPrefix, "process_step_root")}
      aria-current="step"
    >
      <svg
        className={clsxp(classPrefix, "process_step_current_icon")}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className={clsxp(classPrefix, "process_step_current_icon_circle")}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className={clsxp(classPrefix, "process_step_current_icon_path")}
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className={clsxp(classPrefix, "process_step_current_text")}>
        {name}
      </span>
    </span>
  );
};

const Pending = ({ name }: { name: string }) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <span className="group">
      <span className={clsxp(classPrefix, "process_step_root")}>
        <span className={clsxp(classPrefix, "process_step_pending_icon_wrap")}>
          <Circle
            className={clsxp(classPrefix, "process_step_pending_icon")}
            aria-hidden="true"
          />
        </span>
        <span className={clsxp(classPrefix, "process_step_pending_text")}>
          {name}
        </span>
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
