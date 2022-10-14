interface InfraConfigurations {
    element?: HTMLElement;
}

/**
 * A model representing all possible configurations
 * that can be done from embedded script. Those settings
 * are passed around in application via Context.
 */
export interface AppConfigurations {
    poolId: string | null;
    poolName: string | null;
}

export type Configurations = InfraConfigurations & AppConfigurations;

export interface Globals {
    widgetOpen: boolean;
    setWidgetOpen: (open: boolean) => void;
}
