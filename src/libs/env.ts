import { PublicKey } from "@solana/web3.js";

// Must be written like this othwerwise the webpack will not be able to replace the values!!
const PROGRAM_ID = process.env.PROGRAM_ID;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
const FEE_PAYER_URL = process.env.FEE_PAYER_URL;
const UNSTAKE_BASE_URL = process.env.UNSTAKE_BASE_URL;
const GET_ACS_URL = process.env.GET_ACS_URL;

if (!SOLANA_RPC_URL) {
  throw new Error("SOLANA_RPC_URL must be set!");
}

if (!PROGRAM_ID) {
  throw new Error("PROGRAM_ID must be set!");
}

if (!FEE_PAYER_URL) {
  throw new Error("FEE_PAYER_URL must be set!");
}

if (!UNSTAKE_BASE_URL) {
  throw new Error("UNSTAKE_BASE_URL must be set!");
}

if (!GET_ACS_URL) {
  throw new Error("GET_ACS_URL must be set!");
}

interface Config {
  SOLANA_RPC_URL: string;
  PROGRAM_ID: PublicKey;
  FEE_PAYER_URL: string;
  UNSTAKE_BASE_URL: string;
  GET_ACS_URL: string;
}

const config: Config = {
  SOLANA_RPC_URL,
  PROGRAM_ID: new PublicKey(PROGRAM_ID),
  FEE_PAYER_URL,
  UNSTAKE_BASE_URL,
  GET_ACS_URL,
};

export default config;
