import type { Request, Response } from "express";
import Movie from "../models/Movie.js";
import { isDuplicateKeyError } from "../lib/is-duplicate-key-error.js";
import { listWatchlistSchema } from "../schemas/watchlist.schema.js";
import * as watchlistService from "../services/watchlist.service.js";

export async function listWatchlist(
  req: Request,
  res: Response,
): Promise<void> {
  const query = listWatchlistSchema.safeParse(req.query);
  if (!query.success) {
    res
      .status(400)
      .json({ error: { message: "Los filtros de tu lista no son válidos" } });
    return;
  }
  res.json(await watchlistService.listWatchlist(req.user!.id, query.data));
}

export async function createWatchlistItem(
  req: Request,
  res: Response,
): Promise<void> {
  if (!(await Movie.exists({ _id: req.body.movieId }))) {
    res
      .status(404)
      .json({ error: { message: "La película ya no está en el catálogo" } });
    return;
  }
  try {
    const item = await watchlistService.createWatchlistItem(
      req.user!.id,
      req.body.movieId,
    );
    res.status(201).json(item);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    res
      .status(409)
      .json({ error: { message: "La película ya está en tu lista" } });
  }
}

export async function updateWatchlistItem(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const item = await watchlistService.updateWatchlistItem(
    req.user!.id,
    req.params.id,
    req.body,
  );
  if (!item) {
    res
      .status(404)
      .json({ error: { message: "El registro no está en tu lista" } });
    return;
  }
  res.json(item);
}

export async function deleteWatchlistItem(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const item = await watchlistService.deleteWatchlistItem(
    req.user!.id,
    req.params.id,
  );
  if (!item) {
    res
      .status(404)
      .json({ error: { message: "El registro no está en tu lista" } });
    return;
  }
  res.status(204).end();
}
