import { h, createContext, ComponentChildren } from 'preact';
import { AppConfigurations, Globals } from './models';
import { useEffect, useState } from 'preact/hooks';

export const ConfigContext = createContext<AppConfigurations>(
  {} as AppConfigurations
);
export const GlobalsContext = createContext<Globals>({
  widgetOpen: false,
  setWidgetOpen: (o) => undefined,
});

interface Props {
  children: ComponentChildren;
  config: AppConfigurations;
  element?: HTMLElement;
}
export const AppContext = ({ children, config, element }: Props) => {
  const [widgetOpen, setWidgetOpen] = useState(!config.minimized);
  useEffect(() => {
    element?.addEventListener(
      'widget-event',
      (e: CustomEvent<{ name?: string }>) => {
        switch (e.detail.name) {
          case 'open':
            setWidgetOpen(true);
            break;
          case 'close':
            setWidgetOpen(false);
            break;
        }
      }
    );
  }, [element]);

  return (
    <ConfigContext.Provider value={config}>
      <GlobalsContext.Provider value={{ widgetOpen, setWidgetOpen }}>
        {children}
      </GlobalsContext.Provider>
    </ConfigContext.Provider>
  );
};
