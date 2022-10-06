import { type ConnectionConfig, Connection } from '@solana/web3.js';
import { ComponentChildren, h } from 'preact';
import { useMemo } from 'preact/hooks';
import { ConnectionContext } from './useConnection';

export interface ConnectionProviderProps {
  children: ComponentChildren;
  endpoint: string;
  config?: ConnectionConfig;
}

export const ConnectionProvider = ({
  children,
  endpoint,
  config = { commitment: 'confirmed' },
}: ConnectionProviderProps) => {
  const connection = useMemo(
    () => new Connection(endpoint, config),
    [endpoint, config]
  );

  return (
    <ConnectionContext.Provider value={{ connection }}>
      {children}
    </ConnectionContext.Provider>
  );
};
