import { FunctionalComponent, h } from "preact";
import { useContext, useRef } from "preact/hooks";
import RcInputNumber from "../libs/rc-input-number";
import RcSlider from "react-input-slider";
import { formatACSCurrency } from "../libs/utils";
import { ConfigContext } from "../AppContext";
import { clsxp } from "../libs/utils";

export interface InputProps {
  invalid?: boolean;
  invalidText?: string | null;
  onChangeOfValue: (value: number) => void;
  value: number;
  disabled: boolean;
  min: number;
  max: number;
}

function setNativeValue(
  element: HTMLInputElement,
  value: string | number | undefined
) {
  if (element) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, value);
    } else {
      valueSetter?.call(element, value);
    }
  }
}

export const NumberInputWithSlider: FunctionalComponent<InputProps> = (
  props
) => {
  const { classPrefix } = useContext(ConfigContext);
  const { min, max, onChangeOfValue, value } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const changeToMin = () => {
    if (inputRef.current) {
      setNativeValue(inputRef.current, min);
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (onChangeOfValue) {
      onChangeOfValue(Number(min));
    }
  };

  const changeToMax = () => {
    if (inputRef.current) {
      setNativeValue(inputRef.current, max);
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (onChangeOfValue) {
      onChangeOfValue(Number(max));
    }
  };

  const handleSliderChange = (values: { x: number; y: number }) => {
    if (onChangeOfValue) {
      onChangeOfValue(Number(values.x));
    }
  };

  const handleChange = (newValue: number) => {
    if (onChangeOfValue) {
      onChangeOfValue(Number(newValue));
    }
  };

  return (
    <div className={clsxp(classPrefix, "number_input_with_slider_root")}>
      <RcInputNumber
        min={Number(min)}
        max={Number(max)}
        step={1}
        ref={inputRef}
        defaultValue={Number(value)}
        value={Number(value)}
        formatter={(newValue: number) => formatACSCurrency(newValue)}
        onChange={handleChange}
      />
      <div className={clsxp(classPrefix, "number_input_with_slider_slider")}>
        <RcSlider
          xmin={Number(min)}
          xmax={Number(max)}
          xstep={1}
          x={value as number}
          onChange={handleSliderChange}
          styles={{
            track: {
              backgroundColor: "rgba(17,24,39)",
              width: "100%",
            },
            active: {
              backgroundColor: "#749BFF",
            },
            thumb: {
              width: 30,
              height: 30,
              backgroundColor: "#749BFF",
              border: "8px solid rgba(31,41,5)",
            },
          }}
        />
      </div>
      <div className={clsxp(classPrefix, "number_input_with_slider_minmax")}>
        {value === max && max && min && max > min ? (
          <span onClick={changeToMin}>Min</span>
        ) : null}
        {value !== max && max && min && min < max ? (
          <span onClick={changeToMax}>Max</span>
        ) : null}
      </div>
    </div>
  );
};
