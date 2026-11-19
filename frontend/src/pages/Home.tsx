import { Link } from "react-router";
import { useGetMoviesQuery } from "../store/api";
import { useCatalogParams } from "../hooks/useCatalogParams";
import { MovieCard } from "../components/MovieCard";
import { CatalogSearch } from "../components/CatalogSearch";
import { Pagination } from "../components/Pagination";
import { Feedback } from "../components/Feedback";

export function Home() {
  const { search, page, setSearch, setPage } = useCatalogParams();
  const { currentData: result, isFetching, error, refetch } = useGetMoviesQuery({ search, page });

  return (
    <>
      <section className="catalog-intro">
        <h1>
          Una buena película
          <br />
          empieza por elegirla.
        </h1>
        <p>Explorá historias, descubrí otros géneros y encontrá tu próxima película.</p>
      </section>

      <section aria-label="Catálogo de películas">
        <div className="catalog-toolbar">
          <CatalogSearch key={search} initialSearch={search} onSearch={setSearch} />
          {result && (
            <p className="muted" aria-live="polite">
              {result.meta.total} {result.meta.total === 1 ? "película" : "películas"}
              {search ? ` para “${search}”` : " en el catálogo"}
            </p>
          )}
        </div>

        {isFetching && !result && <Feedback title="Cargando películas…" />}
        {error && (
          <Feedback title="No pudimos cargar el catálogo" error>
            <p>{String(error)}</p>
            <button className="button secondary" onClick={() => refetch()}>
              Reintentar
            </button>
          </Feedback>
        )}
        {!error && result && result.data.length === 0 && (
          <Feedback
            title={search ? "No encontramos ese título" : "Todavía no hay películas en esta página"}
          >
            <p>
              {search
                ? "Probá con otro título o volvé al catálogo completo."
                : "El administrador puede cargar nuevas películas."}
            </p>
            {(search || page > 1) && (
              <Link className="button secondary" to="/">
                Ver catálogo completo
              </Link>
            )}
          </Feedback>
        )}

        {!error && result && (
          <>
            <div className="movie-grid" aria-busy={isFetching}>
              {result.data.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={result.meta.totalPages}
              onChange={setPage}
              disabled={isFetching}
            />
          </>
        )}
      </section>
    </>
  );
}
