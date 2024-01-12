import { PublicKey } from '@solana/web3.js';

// Must be written like this othwerwise the webpack will not be able to replace the values!!
const PROGRAM_ID = process.env.PROGRAM_ID;
const TOKEN_MINT = process.env.TOKEN_MINT;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
const SOLANA_NETWORK = process.env.SOLANA_NETWORK;
const FEE_PAYER_URL = process.env.FEE_PAYER_URL;
const UNSTAKE_BASE_URL = process.env.UNSTAKE_BASE_URL;
const REWARDS_BASE_URL = process.env.REWARDS_BASE_URL;
const GET_ACS_URL = process.env.GET_ACS_URL;

if (!SOLANA_RPC_URL) {
  throw new Error('SOLANA_RPC_URL must be set!');
}

if (!SOLANA_NETWORK) {
  throw new Error('SOLANA_NETWORK must be set!');
}

if (!PROGRAM_ID) {
  throw new Error('PROGRAM_ID must be set!');
}

if (!TOKEN_MINT) {
  throw new Error('TOKEN_MINT must be set!');
}

if (!FEE_PAYER_URL) {
  throw new Error('FEE_PAYER_URL must be set!');
}

if (!UNSTAKE_BASE_URL) {
  throw new Error('UNSTAKE_BASE_URL must be set!');
}

if (!REWARDS_BASE_URL) {
  throw new Error('REWARDS_BASE_URL must be set!');
}

if (!GET_ACS_URL) {
  throw new Error('GET_ACS_URL must be set!');
}

interface Config {
  SOLANA_RPC_URL: string;
  SOLANA_NETWORK: string;
  PROGRAM_ID: PublicKey;
  TOKEN_MINT: PublicKey;
  FEE_PAYER_URL: string;
  UNSTAKE_BASE_URL: string;
  REWARDS_BASE_URL: string;
  GET_ACS_URL: string;
}

const config: Config = {
  SOLANA_RPC_URL,
  SOLANA_NETWORK,
  PROGRAM_ID: new PublicKey(PROGRAM_ID),
  TOKEN_MINT: new PublicKey(TOKEN_MINT),
  FEE_PAYER_URL,
  UNSTAKE_BASE_URL,
  REWARDS_BASE_URL,
  GET_ACS_URL,
};

export default config;
