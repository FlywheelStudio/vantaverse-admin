import { z } from 'zod';

/**
 * Shared page shape for lagged (`useQuery`) and infinite (`useInfiniteQuery`) lists.
 * `cursor` is the opaque next-page token (`null` = no further page).
 */
export type PageEnvelope<T> = {
  items: T[];
  total: number;
  cursor: string | null;
};

/** Zod schema for {@link PageEnvelope} over an item schema. */
export function pageEnvelopeSchema<TItem extends z.ZodType>(
  itemSchema: TItem,
): z.ZodObject<{
  items: z.ZodArray<TItem>;
  total: z.ZodNumber;
  cursor: z.ZodNullable<z.ZodString>;
}> {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    cursor: z.string().nullable(),
  });
}
