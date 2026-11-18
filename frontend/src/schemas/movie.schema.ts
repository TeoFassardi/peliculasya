import { z } from "zod";
import { isValidPoster } from "../lib/poster";

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

export const movieSchema = z.object({
  title: z.string().trim().min(1, "Ingresá el título").max(150, "Máximo 150 caracteres"),
  synopsis: z.string().trim().min(1, "Ingresá la sinopsis").max(3000, "Máximo 3000 caracteres"),
  genre: z.enum(MOVIE_GENRES, { error: "Elegí un género" }),
  durationMinutes: z.number({ error: "Ingresá la duración" }).int().min(1).max(600),
  releaseDate: z.iso.date({ error: "Ingresá una fecha válida" }),
  available: z.boolean(),
  posterUrl: z
    .string()
    .max(350_000, "La imagen es demasiado grande")
    .refine(isValidPoster, "Usá una URL HTTPS válida o subí una imagen desde el formulario"),
});

export type MovieFormValues = z.infer<typeof movieSchema>;
