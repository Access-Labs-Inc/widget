import { ComponentChildren, FunctionalComponent, h } from "preact";
import { CSSProperties, useContext } from "preact/compat";
import { ConfigContext } from "../../../AppContext";
import { clsxp } from "../../../libs/utils";

export type ButtonProps = {
  id?: string;
  className?: string;
  disabled?: boolean;
  endIcon?: ComponentChildren;
  onClick?: (e: MouseEvent) => void;
  startIcon?: ComponentChildren;
  externalButtonClass?: string | null;
  style?: CSSProperties;
  tabIndex?: number;
};

export const Button: FunctionalComponent<ButtonProps> = (props) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <button
      className={props.className}
      disabled={props.disabled}
      onClick={props.onClick}
      tabIndex={props.tabIndex || 0}
      type="button"
      id={props.id}
    >
      {props.startIcon && (
        <i className={clsxp(classPrefix, "wallet_adapter_button_start_icon")}>
          {props.startIcon}
        </i>
      )}
      {props.children}
      {props.endIcon && (
        <i className={clsxp(classPrefix, "wallet_adapter_button_end_icon")}>
          {props.endIcon}
        </i>
      )}
    </button>
  );
};
