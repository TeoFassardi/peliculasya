import type { Movie, MoviePage } from "./movie";

export type WatchlistStatus = "all" | "pending" | "watched";

export interface WatchlistItem {
  _id: string;
  movie: Movie | null;
  watched: boolean;
  note: string;
  createdAt: string;
}

export interface WatchlistPage {
  data: WatchlistItem[];
  meta: MoviePage["meta"];
}
