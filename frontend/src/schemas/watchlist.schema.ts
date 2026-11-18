import { z } from "zod";

export const watchlistSchema = z.object({
  watched: z.boolean(),
  note: z.string().trim().max(500, "Usá hasta 500 caracteres"),
});

export type WatchlistFormValues = z.infer<typeof watchlistSchema>;
