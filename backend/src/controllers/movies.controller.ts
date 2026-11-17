import type { Request, Response } from "express";
import * as moviesService from "../services/movies.service.js";
import { listMoviesSchema } from "../schemas/movie.schema.js";

// Express 5 envía las excepciones async al middleware de errores.
export async function listMovies(req: Request, res: Response): Promise<void> {
  const result = listMoviesSchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      error: {
        message: "Los parámetros de búsqueda no son válidos",
        details: result.error.flatten(),
      },
    });
    return;
  }

  res.json(await moviesService.listMovies(result.data));
}

export async function getMovieById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const movie = await moviesService.findMovieById(req.params.id);

  if (!movie) {
    res.status(404).json({ error: { message: "Película inexistente" } });
    return;
  }

  res.json(movie);
}

export async function createMovie(req: Request, res: Response): Promise<void> {
  const movie = await moviesService.createMovie(req.body);
  res.status(201).json(movie);
}

export async function updateMovie(req: Request<{ id: string }>, res: Response): Promise<void> {
  const movie = await moviesService.updateMovie(req.params.id, req.body);

  if (!movie) {
    res.status(404).json({ error: { message: "Película inexistente" } });
    return;
  }

  res.json(movie);
}

export async function deleteMovie(req: Request<{ id: string }>, res: Response): Promise<void> {
  const movie = await moviesService.deleteMovie(req.params.id);

  if (!movie) {
    res.status(404).json({ error: { message: "Película inexistente" } });
    return;
  }

  res.status(204).end();
}
