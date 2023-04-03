import { ComponentChildren, h } from 'preact';
import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import { clsxp } from '../libs/utils';

export const Tooltip = ({
  message,
  children,
}: {
  message: string;
  children: ComponentChildren;
}) => {
  const { classPrefix } = useContext(ConfigContext);
  return (
    <div className={clsxp(classPrefix, 'group', 'tooltip_root')}>
      {children}
      <div className={clsxp(classPrefix, 'tooltip_wrapper')}>
        <span className={clsxp(classPrefix, 'tooltip_message')}>{message}</span>
        <div className={clsxp(classPrefix, 'tooltip_arrow')} />
      </div>
    </div>
  );
};
