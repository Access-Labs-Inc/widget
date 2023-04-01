import { h } from "preact";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../AppContext";
import { clsxp } from "../libs/utils";

const Loading = () => {
  const { classPrefix } = useContext(ConfigContext);

  return (
    <svg
      className={clsxp(classPrefix, "loading")}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className={clsxp(classPrefix, "loading_circle")}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className={clsxp(classPrefix, "loading_path")}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default Loading;
