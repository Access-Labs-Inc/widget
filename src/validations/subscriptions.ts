import { z } from 'zod';

export const serverOffchainBasicSubscription = z.object({
  AssetId: z.string().optional(),
  Owner: z.string(),
  Pool: z.string(),
  Locked: z.number().optional(),
  Bonds: z.number().optional(),
  Forever: z.number().optional(),
  CreatedAt: z.coerce.date(),
  UpdatedAt: z.coerce.date().optional(),
});

export const serverOffchainBasicSubscriptions = z.array(
  serverOffchainBasicSubscription,
);

export const offchainBasicSubscriptionSchema =
  serverOffchainBasicSubscription.transform((item) => ({
    assetId: item.AssetId,
    owner: item.Owner,
    pool: item.Pool,
    locked: item.Locked,
    bonds: item.Bonds,
    forever: item.Forever,
    createdAt: item.CreatedAt,
    updatedAt: item.UpdatedAt,
  }));

export const offchainBasicSubscriptionsSchema =
  serverOffchainBasicSubscriptions.transform((items) =>
    items.map((item) => ({
      assetId: item.AssetId,
      owner: item.Owner,
      pool: item.Pool,
      locked: item.Locked,
      bonds: item.Bonds,
      forever: item.Forever,
      createdAt: item.CreatedAt,
      updatedAt: item.UpdatedAt,
    })),
  );

export type OffchainBasicSubscription = z.infer<
  typeof offchainBasicSubscriptionSchema
>;

export type OffchainBasicSubscriptions = z.infer<
  typeof offchainBasicSubscriptionsSchema
>;
