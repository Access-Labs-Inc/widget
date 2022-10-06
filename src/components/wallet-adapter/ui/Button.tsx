import { ComponentChildren, FunctionalComponent, h } from 'preact';
import { CSSProperties } from 'preact/compat';

export type ButtonProps = {
  className?: string;
  disabled?: boolean;
  endIcon?: ComponentChildren;
  onClick?: (e: any) => void;
  startIcon?: ComponentChildren;
  style?: CSSProperties;
  tabIndex?: number;
};

export const Button: FunctionalComponent<ButtonProps> = (props) => {
  return (
    <button
      className={`wallet-adapter-button ${props.className || ''}`}
      disabled={props.disabled}
      style={props.style}
      onClick={props.onClick}
      tabIndex={props.tabIndex || 0}
      type="button"
    >
      {props.startIcon && (
        <i className="wallet-adapter-button-start-icon">{props.startIcon}</i>
      )}
      {props.children}
      {props.endIcon && (
        <i className="wallet-adapter-button-end-icon">{props.endIcon}</i>
      )}
    </button>
  );
};
