import { ComponentChildren, h } from "preact";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../AppContext";

const styles = {
  tooltipRoot: `relative flex flex-row items-center justify-center`,
  wrapper: `absolute bottom-0 mb-6 hidden w-80 flex-col items-center group-hover:flex`,
  message: `relative z-10 rounded-md bg-stone-500 p-2 text-xs leading-none text-white shadow-lg`,
  arrow: `-mt-2 h-3 w-3 rotate-45 bg-stone-500`,
};

export const Tooltip = ({
  message,
  children,
}: {
  message: string;
  children: ComponentChildren;
}) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <div className={["group", styles.tooltipRoot].join(" ")}>
      {children}
      <div className={styles.wrapper}>
        <span className={styles.message}>{message}</span>
        <div className={styles.arrow} />
      </div>
    </div>
  );
};
