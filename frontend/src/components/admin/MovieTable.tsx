import { Link } from "react-router";
import type { Movie } from "../../types/movie";
import { MoviePoster } from "../MoviePoster";

interface MovieTableProps {
  movies: Movie[];
  busy: boolean;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
}

export function MovieTable({ movies, busy, onEdit, onDelete }: MovieTableProps) {
  return (
    <div className="table-container">
      <table>
        <caption className="sr-only">Películas del catálogo y acciones de administración</caption>
        <thead>
          <tr>
            <th>Título</th>
            <th>Género</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr key={movie._id}>
              <td>
                <Link className="admin-movie-link" to={`/movies/${movie._id}`}>
                  <div className="admin-movie-poster">
                    <MoviePoster title={movie.title} genre={movie.genre} url={movie.posterUrl} />
                  </div>
                  <span>{movie.title}</span>
                </Link>
              </td>
              <td>{movie.genre}</td>
              <td>{movie.available ? "Disponible" : "No disponible"}</td>
              <td>
                <div className="button-row">
                  <button
                    className="button secondary small"
                    disabled={busy}
                    onClick={() => onEdit(movie)}
                    aria-label={`Editar ${movie.title}`}
                  >
                    Editar
                  </button>
                  <button
                    className="button danger small"
                    disabled={busy}
                    onClick={() => onDelete(movie)}
                    aria-label={`Eliminar ${movie.title}`}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
