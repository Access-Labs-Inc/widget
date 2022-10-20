import tw from "twin.macro";
import { ComponentChildren, h } from "preact";

const styles = {
  tooltipRoot: tw`relative flex flex-row items-center justify-center`,
  wrapper: tw`absolute bottom-0 mb-6 hidden w-80 flex-col items-center group-hover:flex`,
  message: tw`relative z-10 rounded-md bg-stone-500 p-2 text-xs leading-none text-white shadow-lg`,
  arrow: tw`-mt-2 h-3 w-3 rotate-45 bg-stone-500`,
};

export const Tooltip = ({
  message,
  children,
}: {
  message: string;
  children: ComponentChildren;
}) => {
  return (
    <div className="group" css={styles.tooltipRoot}>
      {children}
      <div css={styles.wrapper}>
        <span css={styles.message}>{message}</span>
        <div css={styles.arrow} />
      </div>
    </div>
  );
};
