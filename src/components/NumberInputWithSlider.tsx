import tw from 'twin.macro';
import { FunctionalComponent, h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import RcInputNumber from '../libs/rc-input-number';
import ReactSlider from 'react-slider';

export interface InputProps {
  invalid?: boolean;
  invalidText?: string;
  onChangeOfValue: (value: Number) => void;
  value: Number;
  disabled: boolean;
  min: number;
  max: number;
}

function setNativeValue(
  element: HTMLInputElement,
  value: string | number | undefined
) {
  if (element) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      'value'
    )?.set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, value);
    } else {
      valueSetter?.call(element, value);
    }
  }
}

const styles = {
  root: tw`relative my-6`,
  slider: tw`relative mt-2 block h-10 border-0`,
  thumb: tw`cursor-pointer rounded-full border-4 border-gray-800 bg-indigo-500 px-2.5`,
  invalidText: tw`mt-1 text-center text-red-500`,
  minMax: tw`absolute top-0 right-0 mt-4 mr-8 text-lg font-bold hover:cursor-pointer dark:text-indigo-200`,
};

export const NumberInputWithSlider: FunctionalComponent<InputProps> = (
  props
) => {
  const { min, max, onChangeOfValue, invalidText } = props;
  const [stakeAmount, setStakeAmount] = useState<Number>(Number(max));
  const inputRef = useRef<HTMLInputElement>(null);

  const changeToMin = () => {
    if (inputRef.current) {
      setNativeValue(inputRef.current, min);
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setStakeAmount(Number(min));
  };

  const changeToMax = () => {
    if (inputRef.current) {
      setNativeValue(inputRef.current, max);
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setStakeAmount(Number(max));
  };

  const handleSliderChange = (value: number) => {
    setStakeAmount(Number(value));
    if (onChangeOfValue) onChangeOfValue(Number(value));
  };

  const step = Math.round((Number(max) - Number(min)) / 100);

  return (
    <div css={styles.root}>
      <RcInputNumber
        min={Number(min)}
        max={Number(max)}
        step={1}
        ref={inputRef}
        defaultValue={Number(stakeAmount)}
        value={Number(stakeAmount)}
        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        onChange={handleSliderChange}
      />
      <ReactSlider
        css={styles.slider}
        min={Number(min)}
        max={Number(max)}
        step={step}
        value={stakeAmount as number}
        onChange={handleSliderChange}
        trackClassName="react-slider-track"
        renderThumb={(iprops: any) => (
          <div {...iprops} css={styles.thumb}>
            &nbsp;
          </div>
        )}
      />
      <div css={styles.minMax}>
        {stakeAmount === max && max && min && max > min ? (
          <span onClick={changeToMin}>Min</span>
        ) : null}
        {stakeAmount !== max && max && min && min < max ? (
          <span onClick={changeToMax}>Max</span>
        ) : null}
      </div>
      {invalidText && (
        <p css={styles.invalidText}>{invalidText ?? <>&nbsp;</>}</p>
      )}
    </div>
  );
};
