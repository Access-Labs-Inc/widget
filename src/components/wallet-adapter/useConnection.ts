import type { Connection } from '@solana/web3.js';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

export interface ConnectionContextState {
    connection: Connection;
}

export const ConnectionContext = createContext<ConnectionContextState>({} as ConnectionContextState);

export function useConnection(): ConnectionContextState {
    return useContext(ConnectionContext);
}
