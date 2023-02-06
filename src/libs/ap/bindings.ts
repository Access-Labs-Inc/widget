import {
  claimRewardsInstruction,
  createStakeAccountInstruction,
  stakeInstruction,
} from "./raw_instructions";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { CentralState, StakePool, StakeAccount } from "./state";
import BN from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getBondAccounts } from "../program";

export const stake = async (
  connection: Connection,
  stakeAccount: PublicKey,
  sourceToken: PublicKey,
  amount: number,
  programId: PublicKey
) => {
  const stake = await StakeAccount.retrieve(connection, stakeAccount);
  const stakePool = await StakePool.retrieve(connection, stake.stakePool);
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);
  const bondAccounts = await getBondAccounts(
    connection,
    stake.owner,
    programId
  );
  let bondAccountKey: PublicKey | undefined;
  if (bondAccounts.length > 0) {
    bondAccountKey = bondAccounts[0].pubkey;
  }

  const feesAta = await getAssociatedTokenAddress(
    centralState.tokenMint,
    centralState.authority,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const ix = new stakeInstruction({
    amount: new BN(amount),
  }).getInstruction(
    programId,
    centralKey,
    stakeAccount,
    stake.stakePool,
    stake.owner,
    sourceToken,
    TOKEN_PROGRAM_ID,
    stakePool.vault,
    feesAta,
    bondAccountKey
  );

  return ix;
};

export const createStakeAccount = async (
  stakePool: PublicKey,
  owner: PublicKey,
  feePayer: PublicKey,
  programId: PublicKey
) => {
  const [stakeAccount, nonce] = await StakeAccount.getKey(
    programId,
    owner,
    stakePool
  );

  const ix = new createStakeAccountInstruction({
    nonce,
    owner: owner.toBuffer(),
  }).getInstruction(
    programId,
    stakeAccount,
    SystemProgram.programId,
    stakePool,
    feePayer
  );

  return ix;
};

export const claimRewards = async (
  connection: Connection,
  stakeAccount: PublicKey,
  rewardsDestination: PublicKey,
  programId: PublicKey,
  allowZeroRewards: boolean,
  ownerMustSign = true
) => {
  const stake = await StakeAccount.retrieve(connection, stakeAccount);
  const [centralKey] = await CentralState.getKey(programId);
  const centralState = await CentralState.retrieve(connection, centralKey);

  const ix = new claimRewardsInstruction({
    allowZeroRewards: Number(allowZeroRewards),
  }).getInstruction(
    programId,
    stake.stakePool,
    stakeAccount,
    stake.owner,
    rewardsDestination,
    centralKey,
    centralState.tokenMint,
    TOKEN_PROGRAM_ID
  );

  if (!ownerMustSign) {
    const idx = ix.keys.findIndex((e) => e.pubkey.equals(stake.owner));
    ix.keys[idx].isSigner = false;
  }

  return ix;
};
