import { CentralStateV2, StakePool } from '@accessprotocol/js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Connection,
  PublicKey,
  MemcmpFilter,
  AccountInfo,
  RpcResponseAndContext,
  TokenAmount,
} from '@solana/web3.js';
import BN from 'bn.js';

/**
 * This function can be used to find all stake accounts of a user
 * @param connection The Solana RPC connection
 * @param owner The owner of the stake accounts to retrieve
 * @param programId The program ID
 * @returns
 */
export const getStakeAccounts = async (
  connection: Connection,
  owner: PublicKey,
  programId: PublicKey
) => {
  const filters: MemcmpFilter[] = [
    {
      memcmp: {
        offset: 0,
        bytes: '4',
      },
    },
    {
      memcmp: {
        offset: 1,
        bytes: owner.toBase58(),
      },
    },
  ];
  return connection.getProgramAccounts(programId, {
    filters,
  });
};

/**
 * This function can be used to find all bonds of a user
 * @param connection The Solana RPC connection
 * @param owner The owner of the bonds to retrieve
 * @param programId The program ID
 * @returns
 */
export const getBondAccounts = async (
  connection: Connection,
  owner: PublicKey,
  programId: PublicKey
) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '6',
      },
    },
    {
      memcmp: {
        offset: 1,
        bytes: owner.toBase58(),
      },
    },
  ];
  return await connection.getProgramAccounts(programId, {
    filters,
  });
};

const calculateReward = (
  unclaimedDays: number,
  stakePool: StakePool,
  staker: boolean,
): BN => {
  if (unclaimedDays <= 0) {
    return new BN(0);
  }
  const BUFF_LEN = 274;
  const nbDaysBehind =
    unclaimedDays > BUFF_LEN - 1 ? BUFF_LEN - 1 : unclaimedDays;

  const idx = stakePool.currentDayIdx;
  let i = (idx - nbDaysBehind) % BUFF_LEN;

  let reward = new BN(0);
  while (i !== idx % BUFF_LEN) {
    const rewardForDday = staker
      ? ((stakePool.balances[i]?.stakersReward ?? new BN(0)) as BN)
      : stakePool.balances[i]?.poolReward ?? (new BN(0) as BN);
    reward = reward.add(rewardForDday);
    i = (i + 1) % BUFF_LEN;
  }
  return reward;
};

export const calculateRewardForStaker = (
  unclaimedDays: number,
  stakePool: StakePool,
  stakeAmount: BN
) => {
  const reward = calculateReward(unclaimedDays, stakePool, true);
  return reward.mul(stakeAmount).iushrn(31).addn(1).iushrn(1).toNumber();
};

export const getUserACSBalance = async (
  connection: Connection,
  publicKey: PublicKey,
  programId: PublicKey
): Promise<BN> => {
  const [centralKey] = CentralStateV2.getKey(programId);
  const centralState = await CentralStateV2.retrieve(connection, centralKey);
  const userAta: PublicKey = await getAssociatedTokenAddress(
    centralState.tokenMint,
    publicKey,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const userAccount: AccountInfo<Buffer> | null =
    await connection.getAccountInfo(userAta);
  if (userAccount) {
    const accTokensBalance: RpcResponseAndContext<TokenAmount> =
      await connection.getTokenAccountBalance(userAta);
    return new BN(accTokensBalance.value.amount);
  }
  return new BN(0);
};
