import { ComponentChildren, h } from 'preact';
import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import { clsxp } from '../libs/utils';

export const Tooltip = ({
                          messages,
                          children,
                        }: {
  messages: string[];
  children: ComponentChildren;
}) => {
  const { classPrefix } = useContext(ConfigContext);

  return (
    <div className={clsxp(classPrefix, 'group', 'tooltip_root')}>
      {children}
      <div className={clsxp(classPrefix, 'tooltip_wrapper')}>
        <div className={clsxp(classPrefix, 'tooltip_message')}>
          <div className='flex flex-col gap-2'>
            {messages
              .filter((message) => message != null && message !== '')
              .map((message, i) => (
                <div
                  id={`tooltip_message_${i}`}
                >{message}</div>
              ))}
          </div>
        </div>
        <div className={clsxp(classPrefix, 'tooltip_arrow')}/>
      </div>
    </div>
  );
};
