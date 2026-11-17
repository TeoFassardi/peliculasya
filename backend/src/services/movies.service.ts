import Movie from "../models/Movie.js";
import { escapeRegex } from "../lib/escape-regex.js";
import type {
  CreateMovieInput,
  UpdateMovieInput,
  ListMoviesInput,
} from "../schemas/movie.schema.js";

// Esta capa consulta MongoDB; no conoce requests ni respuestas HTTP.
export async function listMovies({ search, page, limit }: ListMoviesInput) {
  const filter = search ? { title: { $regex: escapeRegex(search), $options: "i" } } : {};

  const [data, total] = await Promise.all([
    Movie.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Movie.countDocuments(filter),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export function findMovieById(id: string) {
  return Movie.findById(id);
}

export function createMovie(input: CreateMovieInput) {
  return Movie.create(input);
}

export function updateMovie(id: string, input: UpdateMovieInput) {
  return Movie.findByIdAndUpdate(
    id,
    { $set: input },
    { returnDocument: "after", runValidators: true },
  );
}

export function deleteMovie(id: string) {
  return Movie.findByIdAndDelete(id);
}
