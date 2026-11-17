import { Link } from "react-router";
import type { Movie } from "../types/movie";
import { MoviePoster } from "./MoviePoster";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <article className="movie-card">
      <Link to={`/movies/${movie._id}`} className="movie-link">
        <MoviePoster title={movie.title} genre={movie.genre} url={movie.posterUrl} />
        <div className="movie-card-copy">
          <p className="muted">
            {movie.genre} · {movie.releaseDate.slice(0, 4)}
          </p>
          <h2>{movie.title}</h2>
          <p className="muted">{movie.durationMinutes} min</p>
        </div>
      </Link>
    </article>
  );
}
