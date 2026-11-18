import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Identificador inválido");

export const createWatchlistSchema = z.object({ movieId: objectId }).strict();

export const updateWatchlistSchema = z
  .object({
    watched: z.boolean().optional(),
    note: z
      .string()
      .trim()
      .max(500, "La nota admite hasta 500 caracteres")
      .optional(),
  })
  .strict()
  .refine(
    (values) => Object.keys(values).length > 0,
    "Indicá un campo para editar",
  );

export const listWatchlistSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    status: z.enum(["all", "pending", "watched"]).default("all"),
    movieId: objectId.optional(),
  })
  .strict();

export type ListWatchlistInput = z.infer<typeof listWatchlistSchema>;
export type UpdateWatchlistInput = z.infer<typeof updateWatchlistSchema>;
