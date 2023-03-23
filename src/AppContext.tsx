import { h, createContext, ComponentChildren } from "preact";
import { Configurations } from "./models";

export const ConfigContext = createContext<Configurations>(
  {} as Configurations
);

interface Props {
  children: ComponentChildren;
  config: Configurations;
  element?: HTMLElement;
}
export const AppContext = ({ children, config, element }: Props) => {
  const enhancedConfig = { ...config, element };
  return (
    <ConfigContext.Provider value={enhancedConfig}>
      {children}
    </ConfigContext.Provider>
  );
};
