import { Fragment, h } from "preact";
import { RouteLink } from "../layout/Router";
import { useContext, useEffect, useState } from "preact/hooks";
import { ConfigContext } from "../AppContext";
import { clsxp } from "../libs/utils";
import Loading from "./Loading";

const ProgressModal = ({
  working,
  doneStepName,
}: {
  working: string;
  doneStepName: string;
}) => {
  const { classPrefix } = useContext(ConfigContext);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (working === doneStepName && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [working, doneStepName, countdown]);

  const isButtonDisabled = working !== doneStepName || countdown > 0;

  return (
    <Fragment>
      <div className={clsxp(classPrefix, "process_modal_title")}>
        Sign a transaction
      </div>
      <div className={clsxp(classPrefix, "process_modal_subtitle")}>
        {working === doneStepName
          ? "Transaction sent successfully."
          : "We need you to sign a transaction to lock your funds."}
      </div>
      <nav
        className={clsxp(classPrefix, "process_modal_steps")}
        aria-label="Progress"
      >
        <div className={clsxp(classPrefix, "process_modal_steps_load")}>
          {working !== doneStepName && <Loading />}
        </div>
        <RouteLink
          disabled={isButtonDisabled}
          href="/"
          className={clsxp(
            classPrefix,
            "process_modal_button",
            isButtonDisabled
              ? "process_modal_button_disabled"
              : "process_modal_button_selected"
          )}
        >
          {isButtonDisabled && countdown > 0 ? `Close (${countdown})` : "Close"}
        </RouteLink>
      </nav>
    </Fragment>
  );
};

export { ProgressModal };
