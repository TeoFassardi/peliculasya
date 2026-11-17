import { Link, useParams } from "react-router";
import { useGetMovieQuery } from "../store/api";
import { MoviePoster } from "../components/MoviePoster";
import { Feedback } from "../components/Feedback";

export function MovieDetail() {
  const { id = "" } = useParams();
  const { data: movie, isLoading, error } = useGetMovieQuery(id);

  if (isLoading) return <Feedback title="Cargando película…" />;
  if (error || !movie) {
    return (
      <Feedback title="No pudimos mostrar esta película" error>
        <p>{String(error ?? "La película no existe")}</p>
        <Link className="button secondary" to="/">
          Volver al catálogo
        </Link>
      </Feedback>
    );
  }

  return (
    <>
      <Link className="back-link" to="/">
        Volver al catálogo
      </Link>
      <article className="movie-detail">
        <MoviePoster title={movie.title} genre={movie.genre} url={movie.posterUrl} />
        <div className="detail-copy">
          <p className="muted">
            {movie.genre} · {movie.releaseDate.slice(0, 4)}
          </p>
          <h1>{movie.title}</h1>
          <span className="status-badge">{movie.available ? "Disponible" : "No disponible"}</span>
          <h2>Sinopsis</h2>
          <p className="synopsis">{movie.synopsis}</p>
          <dl className="movie-facts">
            <div>
              <dt>Duración</dt>
              <dd>{movie.durationMinutes} minutos</dd>
            </div>
            <div>
              <dt>Estreno</dt>
              <dd>
                {new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeZone: "UTC" }).format(
                  new Date(movie.releaseDate),
                )}
              </dd>
            </div>
            <div>
              <dt>Género</dt>
              <dd>{movie.genre}</dd>
            </div>
          </dl>
        </div>
      </article>
    </>
  );
}
