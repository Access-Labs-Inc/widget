import { CentralState, StakePool } from '@ap';
import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
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

// Hard-coded values.
export const ACCESS_PROGRAM_ID = new PublicKey('acp1VPqNoMs5KC5aEH3MzxnyPZNyKQF1TCPouCoNRuX');
const SECONDS_IN_DAY = 86400;

/**
 * This function can be used to find all stake accounts of a user
 * @param connection The Solana RPC connection
 * @param owner The owner of the stake accounts to retrieve
 * @returns
 */
export const getStakeAccounts = async (
  connection: Connection,
  owner: PublicKey,
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
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to find all stake pools of a user
 * @param connection The Solana RPC connection
 * @param owner The owner of the stake pools to retrieve
 * @returns
 */
export const getStakePools = async (
  connection: Connection,
  owner: PublicKey,
) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '2',
      },
    },
    {
      memcmp: {
        offset: 1 + 1 + 2 + 4 + 8 + 8 + 8,
        bytes: owner.toBase58(),
      },
    },
  ];
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to find all inactive stake pools of a user
 * @param connection The Solana RPC connection
 * @param owner The owner of the stake pools to retrieve
 * @returns
 */
export const getInactiveStakePools = async (
  connection: Connection,
  owner: PublicKey,
) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '3',
      },
    },
    {
      memcmp: {
        offset: 1 + 1 + 2 + 4 + 8 + 8 + 8,
        bytes: owner.toBase58(),
      },
    },
  ];
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to find all bonds of a user
 * @param connection The Solana RPC connection
 * @param owner The owner of the bonds to retrieve
 * @returns
 */
export const getBondAccounts = async (
  connection: Connection,
  owner: PublicKey,
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
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to retrieve all the stake pools
 * @param connection The Solana RPC connection
 * @returns
 */
export const getAllStakePools = async (connection: Connection) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '2',
      },
    },
  ];
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to retrieve all the inactive stake pools
 * @param connection The Solana RPC connection
 * @returns
 */
export const getAllInactiveStakePools = async (connection: Connection) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '3',
      },
    },
  ];
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to retrieve all the inactive bonds
 * @param connection The Solana RPC connection
 * @returns
 */
export const getAllInactiveBonds = async (connection: Connection) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '5',
      },
    },
  ];
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to retrieve all the inactive bonds
 * @param connection The Solana RPC connection
 * @returns
 */
export const getAllInactiveBondAccounts = async (
  connection: Connection,
  owner: PublicKey,
) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '5',
      },
    },
    {
      memcmp: {
        offset: 1,
        bytes: owner.toBase58(),
      },
    },
  ];
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to retrieve all the active bonds
 * @param connection The Solana RPC connection
 * @returns
 */
export const getAllActiveBonds = async (connection: Connection) => {
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: '6',
      },
    },
  ];
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

/**
 * This function can be used to retrieve all the active bonds
 * @param connection The Solana RPC connection
 * @param owner Public key of the owner
 * @returns
 */
export const getAllActiveBondAccounts = async (
  connection: Connection,
  owner: PublicKey,
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
  return connection.getProgramAccounts(ACCESS_PROGRAM_ID, {
    filters,
  });
};

const calculateReward = (
  lastClaimedTime: BN,
  stakePool: StakePool,
  staker: boolean,
) => {
  const BUFF_LEN = 274;
  let nbDaysBehind = new Date().getTime() - Number(lastClaimedTime) * 1000;
  nbDaysBehind = Math.round(
    nbDaysBehind / 1000 / Number(SECONDS_IN_DAY),
  );
  nbDaysBehind = nbDaysBehind > BUFF_LEN - 1 ? BUFF_LEN - 1 : nbDaysBehind;

  const idx = stakePool.currentDayIdx + 1;
  let i = (idx - nbDaysBehind) % BUFF_LEN;

  let reward = new BN(0);
  while (i !== (idx + 1) % BUFF_LEN) {
    const rewardForDday = staker
      ? ((stakePool.balances[i]?.stakersReward ?? new BN(0)) as BN)
      : stakePool.balances[i]?.poolReward ?? (new BN(0) as BN);
    reward = reward.add(rewardForDday as BN);
    i = (i + 1) % BUFF_LEN;
  }
  return reward;
};

export const calculateRewardForStaker = (
  lastClaimedTime: BN,
  stakePool: StakePool,
  stakeAmount: BN,
) => {
  const reward = calculateReward(lastClaimedTime, stakePool, true);
  return reward.mul(new BN(stakeAmount.toNumber())).iushrn(32).divn(10 ** 6);
};

export const calculateRewardForPool = (
  lastClaimedTime: BN,
  stakePool: StakePool,
) => {
  const reward = calculateReward(lastClaimedTime, stakePool, false);
  return reward.iushrn(32).toNumber();
};

export const getUserACSBalance = async (
  connection: Connection,
  publicKey: PublicKey,
): Promise<BN> => {
  const [centralKey] = await CentralState.getKey(ACCESS_PROGRAM_ID);
  const centralState = await CentralState.retrieve(connection, centralKey);
  const userAta: PublicKey = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    centralState.tokenMint,
    publicKey,
  );
  const userAccount: AccountInfo<Buffer> | null =
    await connection.getAccountInfo(userAta);
  if (userAccount) {
    const accTokensBalance: RpcResponseAndContext<TokenAmount> =
      await connection.getTokenAccountBalance(userAta);
    return new BN(accTokensBalance.value.amount).divn(10 ** 6);
  }
  return new BN(0);
};
