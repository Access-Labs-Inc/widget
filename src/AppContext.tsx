import { h, createContext, ComponentChildren } from 'preact';
import { AppConfigurations } from './models';

export const ConfigContext = createContext<AppConfigurations>(
  {} as AppConfigurations
);

interface Props {
  children: ComponentChildren;
  config: AppConfigurations;
  element?: HTMLElement;
}
export const AppContext = ({ children, config, element }: Props) => {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
