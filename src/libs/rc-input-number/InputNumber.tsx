import { h, Ref } from "preact";
import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { ChangeEventHandler, forwardRef } from "preact/compat";
import KeyCode from "rc-util/lib/KeyCode";
import { useLayoutUpdateEffect } from "rc-util/lib/hooks/useLayoutEffect";
import { composeRef } from "rc-util/lib/ref";
import getMiniDecimal, {
  DecimalClass,
  toFixed,
  ValueType,
} from "./utils/MiniDecimal";
import {
  getNumberPrecision,
  num2str,
  getDecupleSteps,
  validateNumber,
} from "./utils/numberUtil";
import useCursor from "./hooks/useCursor";
import useFrame from "./hooks/useFrame";
import { ConfigContext } from "../../AppContext";
import { clsxp } from "../utils";

/**
 * We support `stringMode` which need handle correct type when user call in onChange
 * format max or min value
 * 1. if isInvalid return null
 * 2. if precision is undefined, return decimal
 * 3. format with precision
 *    I. if max > 0, round down with precision. Example: max= 3.5, precision=0  afterFormat: 3
 *    II. if max < 0, round up with precision. Example: max= -3.5, precision=0  afterFormat: -4
 *    III. if min > 0, round up with precision. Example: min= 3.5, precision=0  afterFormat: 4
 *    IV. if min < 0, round down with precision. Example: max= -3.5, precision=0  afterFormat: -3
 */

const getDecimalValue = (stringMode: boolean, decimalValue: DecimalClass) => {
  if (stringMode || decimalValue.isEmpty()) {
    return decimalValue.toString();
  }

  return decimalValue.toNumber();
};

const getDecimalIfValidate = (value: ValueType) => {
  const decimal = getMiniDecimal(value);
  return decimal.isInvalidate() ? null : decimal;
};

const InputNumber = forwardRef((props: any, ref: Ref<any>) => {
  const {
    style,
    min,
    max,
    step = 1,
    defaultValue,
    value,
    disabled,
    readOnly,
    upHandler,
    downHandler,
    keyboard,
    controls = true,

    stringMode,

    parser,
    formatter,
    precision,
    decimalSeparator,

    onChange,
    onInput,
    onPressEnter,
    onStep,

    ...inputProps
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);

  const [focus, setFocus] = useState(false);

  const userTypingRef = useRef(false);
  const compositionRef = useRef(false);
  const shiftKeyRef = useRef(false);

  // ============================ Value =============================
  // Real value control
  const [decimalValue, setDecimalValue] = useState<DecimalClass>(() =>
    getMiniDecimal(value ?? defaultValue)
  );

  function setUncontrolledDecimalValue(newDecimal: DecimalClass) {
    if (value === undefined) {
      setDecimalValue(newDecimal);
    }
  }

  // ====================== Parser & Formatter ======================
  /**
   * `precision` is used for formatter & onChange.
   * It will auto generate by `value` & `step`.
   * But it will not block user typing.
   *
   * Note: Auto generate `precision` is used for legacy logic.
   * We should remove this since we already support high precision with BigInt.
   *
   * @param number  Provide which number should calculate precision
   * @param userTyping  Change by user typing
   */
  const getPrecision = useCallback(
    (numStr: string, userTyping: boolean) => {
      if (userTyping) {
        return undefined;
      }

      if (precision && precision >= 0) {
        return precision;
      }

      return Math.max(getNumberPrecision(numStr), getNumberPrecision(step));
    },
    [precision, step]
  );

  // >>> Parser
  const mergedParser = useCallback(
    (num: string | number) => {
      const numStr = String(num);

      if (parser) {
        return parser(numStr);
      }

      let parsedStr = numStr;
      if (decimalSeparator) {
        parsedStr = parsedStr.replace(decimalSeparator, ".");
      }

      // [Legacy] We still support auto convert `$ 123,456` to `123456`
      return parsedStr.replace(/[^\w.-]+/g, "");
    },
    [parser, decimalSeparator]
  );

  // >>> Formatter
  const inputValueRef = useRef<string | number>("");
  const mergedFormatter = useCallback(
    (number: string, userTyping: boolean) => {
      if (formatter) {
        return formatter(number, {
          userTyping,
          input: String(inputValueRef.current),
        });
      }

      let str = typeof number === "number" ? num2str(number) : number;

      // User typing will not auto format with precision directly
      if (!userTyping) {
        const mergedPrecision = getPrecision(str, userTyping);

        if (validateNumber(str) && (decimalSeparator || mergedPrecision >= 0)) {
          // Separator
          const separatorStr = decimalSeparator || ".";

          str = toFixed(str, separatorStr, mergedPrecision);
        }
      }

      return str;
    },
    [formatter, getPrecision, decimalSeparator]
  );

  // ========================== InputValue ==========================
  /**
   * Input text value control
   *
   * User can not update input content directly. It update with follow rules by priority:
   *  1. controlled `value` changed
   *    * [SPECIAL] Typing like `1.` should not immediately convert to `1`
   *  2. User typing with format (not precision)
   *  3. Blur or Enter trigger revalidate
   */
  const [inputValue, setInternalInputValue] = useState<string | number>(() => {
    const initValue = defaultValue ?? value;
    if (
      decimalValue.isInvalidate() &&
      ["string", "number"].includes(typeof initValue)
    ) {
      return Number.isNaN(initValue) ? "" : initValue;
    }
    return mergedFormatter(decimalValue.toString(), false);
  });
  inputValueRef.current = inputValue;

  // Should always be string
  function setInputValue(newValue: DecimalClass, userTyping: boolean) {
    setInternalInputValue(
      mergedFormatter(
        // Invalidate number is sometime passed by external control, we should let it go
        // Otherwise is controlled by internal interactive logic which check by userTyping
        // You can ref 'show limited value when input is not focused' test for more info.
        newValue.isInvalidate()
          ? newValue.toString(false)
          : newValue.toString(!userTyping),
        userTyping
      )
    );
  }

  // >>> Max & Min limit
  const maxDecimal = useMemo(() => getDecimalIfValidate(max), [max, precision]);
  const minDecimal = useMemo(() => getDecimalIfValidate(min), [min, precision]);

  const upDisabled = useMemo(() => {
    if (!maxDecimal || !decimalValue || decimalValue.isInvalidate()) {
      return false;
    }

    return maxDecimal.lessEquals(decimalValue);
  }, [maxDecimal, decimalValue]);

  const downDisabled = useMemo(() => {
    if (!minDecimal || !decimalValue || decimalValue.isInvalidate()) {
      return false;
    }

    return decimalValue.lessEquals(minDecimal);
  }, [minDecimal, decimalValue]);

  // Cursor controller
  const [recordCursor, restoreCursor] = useCursor(inputRef.current, focus);

  // ============================= Data =============================
  /**
   * Find target value closet within range.
   * e.g. [11, 28]:
   *    3  => 11
   *    23 => 23
   *    99 => 28
   */
  const getRangeValue = (target: DecimalClass) => {
    // target > max
    if (maxDecimal && !target.lessEquals(maxDecimal)) {
      return maxDecimal;
    }

    // target < min
    if (minDecimal && !minDecimal.lessEquals(target)) {
      return minDecimal;
    }

    return null;
  };

  /**
   * Check value is in [min, max] range
   */
  const isInRange = (target: DecimalClass) => !getRangeValue(target);

  /**
   * Trigger `onChange` if value validated and not equals of origin.
   * Return the value that re-align in range.
   */
  const triggerValueUpdate = (
    newValue: DecimalClass,
    userTyping: boolean
  ): DecimalClass => {
    let updateValue = newValue;

    let isRangeValidate = isInRange(updateValue) || updateValue.isEmpty();

    // Skip align value when trigger value is empty.
    // We just trigger onChange(null)
    // This should not block user typing
    if (!updateValue.isEmpty() && !userTyping) {
      // Revert value in range if needed
      updateValue = getRangeValue(updateValue) || updateValue;
      isRangeValidate = true;
    }

    if (!readOnly && !disabled && isRangeValidate) {
      const numStr = updateValue.toString();
      const mergedPrecision = getPrecision(numStr, userTyping);
      if (mergedPrecision >= 0) {
        updateValue = getMiniDecimal(toFixed(numStr, ".", mergedPrecision));

        // When to fixed. The value may out of min & max range.
        // 4 in [0, 3.8] => 3.8 => 4 (toFixed)
        if (!isInRange(updateValue)) {
          updateValue = getMiniDecimal(
            toFixed(numStr, ".", mergedPrecision, true)
          );
        }
      }

      // Trigger event
      if (!updateValue.equals(decimalValue)) {
        setUncontrolledDecimalValue(updateValue);
        onChange?.(
          updateValue.isEmpty()
            ? null
            : getDecimalValue(stringMode, updateValue)
        );

        // Reformat input if value is not controlled
        if (value === undefined) {
          setInputValue(updateValue, userTyping);
        }
      }

      return updateValue;
    }

    return decimalValue;
  };

  // ========================== User Input ==========================
  const onNextPromise = useFrame();

  // >>> Collect input value
  const collectInputValue = (inputStr: string) => {
    recordCursor();

    // Update inputValue incase input can not parse as number
    setInternalInputValue(inputStr);

    // Parse number
    if (!compositionRef.current) {
      const finalValue = mergedParser(inputStr);
      const finalDecimal = getMiniDecimal(finalValue);
      if (!finalDecimal.isNaN()) {
        triggerValueUpdate(finalDecimal, true);
      }
    }

    // Trigger onInput later to let user customize value if they want do handle something after onChange
    onInput?.(inputStr);

    // optimize for chinese input experience
    // https://github.com/ant-design/ant-design/issues/8196
    onNextPromise(() => {
      let nextInputStr = inputStr;
      if (!parser) {
        nextInputStr = inputStr.replace(/。/g, ".");
      }

      if (nextInputStr !== inputStr) {
        collectInputValue(nextInputStr);
      }
    });
  };

  // >>> Composition
  const onCompositionStart = () => {
    compositionRef.current = true;
  };

  const onCompositionEnd = () => {
    compositionRef.current = false;

    if (inputRef.current) {
      collectInputValue(inputRef.current.value);
    }
  };

  // >>> Input
  const onInternalInput: ChangeEventHandler<HTMLInputElement> = (e) => {
    if ((e.target as HTMLInputElement).value) {
      collectInputValue((e.target as HTMLInputElement).value);
    }
  };

  // ============================= Step =============================
  const onInternalStep = (up: boolean) => {
    // Ignore step since out of range
    if ((up && upDisabled) || (!up && downDisabled)) {
      return;
    }

    // Clear typing status since it may caused by up & down key.
    // We should sync with input value.
    userTypingRef.current = false;

    let stepDecimal = getMiniDecimal(
      shiftKeyRef.current ? getDecupleSteps(step) : step
    );
    if (!up) {
      stepDecimal = stepDecimal.negate();
    }

    const target = (decimalValue || getMiniDecimal(0)).add(
      stepDecimal.toString()
    );

    const updatedValue = triggerValueUpdate(target, false);

    onStep?.(getDecimalValue(stringMode, updatedValue), {
      offset: shiftKeyRef.current ? getDecupleSteps(step) : step,
      type: up ? "up" : "down",
    });

    inputRef.current?.focus();
  };

  // ============================ Flush =============================
  /**
   * Flush current input content to trigger value change & re-formatter input if needed
   */
  const flushInputValue = (userTyping: boolean) => {
    const parsedValue = getMiniDecimal(mergedParser(inputValue));
    let formatValue: DecimalClass = parsedValue;

    if (!parsedValue.isNaN()) {
      // Only validate value or empty value can be re-fill to inputValue
      // Reassign the formatValue within ranged of trigger control
      formatValue = triggerValueUpdate(parsedValue, userTyping);
    } else {
      formatValue = decimalValue;
    }

    if (value !== undefined) {
      // Reset back with controlled value first
      setInputValue(decimalValue, false);
    } else if (!formatValue.isNaN()) {
      // Reset input back since no validate value
      setInputValue(formatValue, false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const { which, shiftKey } = event;
    userTypingRef.current = true;

    if (shiftKey) {
      shiftKeyRef.current = true;
    } else {
      shiftKeyRef.current = false;
    }

    if (which === KeyCode.ENTER) {
      if (!compositionRef.current) {
        userTypingRef.current = false;
      }
      flushInputValue(false);
      onPressEnter?.(event);
    }

    if (keyboard === false) {
      return;
    }

    // Do step
    if (!compositionRef.current && [KeyCode.UP, KeyCode.DOWN].includes(which)) {
      onInternalStep(KeyCode.UP === which);
      event.preventDefault();
    }
  };

  const onKeyUp = () => {
    userTypingRef.current = false;
    shiftKeyRef.current = false;
  };

  // >>> Focus & Blur
  const onBlur = () => {
    flushInputValue(false);

    setFocus(false);

    userTypingRef.current = false;
  };

  // ========================== Controlled ==========================
  // Input by precision
  useLayoutUpdateEffect(() => {
    if (!decimalValue.isInvalidate()) {
      setInputValue(decimalValue, false);
    }
  }, [precision]);

  // Input by value
  useLayoutUpdateEffect(() => {
    const newValue = getMiniDecimal(value);
    setDecimalValue(newValue);

    const currentParsedValue = getMiniDecimal(mergedParser(inputValue));

    // When user typing from `1.2` to `1.`, we should not convert to `1` immediately.
    // But let it go if user set `formatter`
    if (
      !newValue.equals(currentParsedValue) ||
      !userTypingRef.current ||
      formatter
    ) {
      // Update value as effect
      setInputValue(newValue, userTypingRef.current);
    }
  }, [value]);

  // ============================ Cursor ============================
  useLayoutUpdateEffect(() => {
    if (formatter) {
      restoreCursor();
    }
  }, [inputValue]);

  const { classPrefix } = useContext(ConfigContext);

  // ============================ Render ============================
  return (
    <div
      className={clsxp(
        classPrefix,
        "rc_input_number_root",
        focus && "rc_input_number_root_focused",
        disabled && "rc_input_number_root_disabled",
        readOnly && "rc_input_number_root_readonly",
        decimalValue.isNaN() && "rc_input_number_root_nan",
        !decimalValue.isInvalidate() &&
          !isInRange(decimalValue) &&
          "rc_input_number_root_out_of_range"
      )}
      style={style}
      onFocus={() => {
        setFocus(true);
      }}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
    >
      <div className={clsxp(classPrefix, "rc_input_number_wrap")}>
        <input
          autoComplete="off"
          role="input"
          aria-valuemin={min as number}
          aria-valuemax={max as number}
          aria-valuenow={
            decimalValue.isInvalidate()
              ? null
              : (decimalValue.toString() as string)
          }
          step={step}
          {...inputProps}
          ref={composeRef(inputRef, ref as any)}
          className={clsxp(classPrefix, "rc_input_number_input")}
          value={inputValue}
          onChange={onInternalInput}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
});

InputNumber.displayName = "InputNumber";

export default InputNumber;
