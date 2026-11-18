import { z } from "zod";
import { posterUrlSchema } from "./poster.schema.js";

export const MOVIE_GENRES = [
  "Acción",
  "Comedia",
  "Drama",
  "Terror",
  "Ciencia ficción",
  "Animación",
  "Documental",
  "Aventura",
  "Suspenso",
  "Romance",
] as const;

const movieFieldsSchema = z
  .object({
    title: z.string().trim().min(1, "El título es obligatorio").max(150),
    synopsis: z.string().trim().min(1, "La sinopsis es obligatoria").max(3000),
    genre: z.enum(MOVIE_GENRES, { error: "Elegí un género válido" }),
    durationMinutes: z.number().int().min(1).max(600),
    releaseDate: z.iso.date({ error: "Ingresá una fecha válida" }),
    available: z.boolean(),
    posterUrl: posterUrlSchema.optional(),
  })
  .strict();

export const createMovieSchema = movieFieldsSchema.extend({
  available: z.boolean().default(true),
});

// Los defaults de creación no deben modificar campos ausentes en PATCH.
export const updateMovieSchema = movieFieldsSchema
  .partial()
  .refine(
    (values) => Object.keys(values).length > 0,
    "Indicá al menos un campo para editar",
  );

export const listMoviesSchema = z
  .object({
    search: z.string().trim().max(120).default(""),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  })
  .strict();

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type ListMoviesInput = z.infer<typeof listMoviesSchema>;
