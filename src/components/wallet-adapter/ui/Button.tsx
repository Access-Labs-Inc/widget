import { ComponentChildren, FunctionalComponent, h } from "preact";
import { CSSProperties } from "preact/compat";
import tw, { TwStyle } from "twin.macro";

export type ButtonProps = {
  id?: string;
  className?: string;
  disabled?: boolean;
  endIcon?: ComponentChildren;
  onClick?: (e: any) => void;
  startIcon?: ComponentChildren;
  cssClass?: TwStyle | (TwStyle | null)[];
  style?: CSSProperties;
  tabIndex?: number;
};

const styles = {
  wallet_adapter_button: tw`bg-transparent border-0 cursor-pointer flex items-center rounded-[4px]`,
  wallet_adapter_button_start_icon: tw`flex items-center justify-center w-[24px] h-[24px] ml-2`,
  wallet_adapter_button_end_icon: tw`flex items-center justify-center w-[24px] h-[24px] mr-2`,
};

export const Button: FunctionalComponent<ButtonProps> = (props) => {
  return (
    <button
      css={[styles.wallet_adapter_button, props.cssClass]}
      disabled={props.disabled}
      style={props.style}
      onClick={props.onClick}
      tabIndex={props.tabIndex || 0}
      type="button"
      id={props.id}
    >
      {props.startIcon && (
        <i css={styles.wallet_adapter_button_start_icon}>{props.startIcon}</i>
      )}
      {props.children}
      {props.endIcon && (
        <i css={styles.wallet_adapter_button_end_icon}>{props.endIcon}</i>
      )}
    </button>
  );
};
