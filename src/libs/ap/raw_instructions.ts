// This file is auto-generated. DO NOT EDIT
import BN from 'bn.js';
import { Schema, serialize } from 'borsh';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

interface AccountKey {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
}
export class createStakeAccountInstruction {
  tag: number;
  nonce: number;
  owner: Uint8Array;
  static schema: Schema = new Map([
    [
      createStakeAccountInstruction,
      {
        kind: 'struct',
        fields: [
          ['tag', 'u8'],
          ['nonce', 'u8'],
          ['owner', [32]],
        ],
      },
    ],
  ]);
  constructor(obj: { nonce: number; owner: Uint8Array }) {
    this.tag = 3;
    this.nonce = obj.nonce;
    this.owner = obj.owner;
  }
  serialize(): Uint8Array {
    return serialize(createStakeAccountInstruction.schema, this);
  }
  getInstruction(
    programId: PublicKey,
    stakeAccount: PublicKey,
    systemProgram: PublicKey,
    stakePool: PublicKey,
    feePayer: PublicKey
  ): TransactionInstruction {
    const data = Buffer.from(this.serialize());
    let keys: AccountKey[] = [];
    keys.push({
      pubkey: stakeAccount,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: systemProgram,
      isSigner: false,
      isWritable: false,
    });
    keys.push({
      pubkey: stakePool,
      isSigner: false,
      isWritable: false,
    });
    keys.push({
      pubkey: feePayer,
      isSigner: true,
      isWritable: true,
    });
    return new TransactionInstruction({
      keys,
      programId,
      data,
    });
  }
}
export class stakeInstruction {
  tag: number;
  amount: BN;
  static schema: Schema = new Map([
    [
      stakeInstruction,
      {
        kind: 'struct',
        fields: [
          ['tag', 'u8'],
          ['amount', 'u64'],
        ],
      },
    ],
  ]);
  constructor(obj: { amount: BN }) {
    this.tag = 4;
    this.amount = obj.amount;
  }
  serialize(): Uint8Array {
    return serialize(stakeInstruction.schema, this);
  }
  getInstruction(
    programId: PublicKey,
    centralStateAccount: PublicKey,
    stakeAccount: PublicKey,
    stakePool: PublicKey,
    owner: PublicKey,
    sourceToken: PublicKey,
    splTokenProgram: PublicKey,
    vault: PublicKey,
    feeAccount: PublicKey
  ): TransactionInstruction {
    const data = Buffer.from(this.serialize());
    let keys: AccountKey[] = [];
    keys.push({
      pubkey: centralStateAccount,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: stakeAccount,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: stakePool,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: owner,
      isSigner: true,
      isWritable: false,
    });
    keys.push({
      pubkey: sourceToken,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: splTokenProgram,
      isSigner: false,
      isWritable: false,
    });
    keys.push({
      pubkey: vault,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: feeAccount,
      isSigner: false,
      isWritable: true,
    });
    return new TransactionInstruction({
      keys,
      programId,
      data,
    });
  }
}
export class claimRewardsInstruction {
  tag: number;
  allowZeroRewards: number;
  static schema: Schema = new Map([
    [
      claimRewardsInstruction,
      {
        kind: 'struct',
        fields: [
          ['tag', 'u8'],
          ['allowZeroRewards', 'u8'],
        ],
      },
    ],
  ]);
  constructor(obj: { allowZeroRewards: number }) {
    this.tag = 8;
    this.allowZeroRewards = obj.allowZeroRewards;
  }
  serialize(): Uint8Array {
    return serialize(claimRewardsInstruction.schema, this);
  }
  getInstruction(
    programId: PublicKey,
    stakePool: PublicKey,
    stakeAccount: PublicKey,
    owner: PublicKey,
    rewardsDestination: PublicKey,
    centralState: PublicKey,
    mint: PublicKey,
    splTokenProgram: PublicKey
  ): TransactionInstruction {
    const data = Buffer.from(this.serialize());
    let keys: AccountKey[] = [];
    keys.push({
      pubkey: stakePool,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: stakeAccount,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: owner,
      isSigner: true,
      isWritable: false,
    });
    keys.push({
      pubkey: rewardsDestination,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: centralState,
      isSigner: false,
      isWritable: false,
    });
    keys.push({
      pubkey: mint,
      isSigner: false,
      isWritable: true,
    });
    keys.push({
      pubkey: splTokenProgram,
      isSigner: false,
      isWritable: false,
    });
    return new TransactionInstruction({
      keys,
      programId,
      data,
    });
  }
}
