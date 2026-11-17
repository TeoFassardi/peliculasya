export interface Movie {
  _id: string;
  title: string;
  synopsis: string;
  genre: string;
  durationMinutes: number;
  releaseDate: string;
  available: boolean;
  posterUrl?: string;
  createdAt: string;
}

export interface MoviePage {
  data: Movie[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
