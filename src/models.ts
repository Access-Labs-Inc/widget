interface InfraConfigurations {
  element?: HTMLElement;
  debug?: boolean;
}

/**
 * A model representing all possible configurations
 * that can be done from embedded script. Those settings
 * are passed around in application via Context.
 */
export interface AppConfigurations {
  poolId: string | null;
  poolName: string | null;
  disconnectButtonClass?: string | null;
  connectedButtonClass?: string | null;
}

export type Configurations = InfraConfigurations & AppConfigurations;
