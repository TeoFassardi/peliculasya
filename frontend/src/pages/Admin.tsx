import { useState } from "react";
import type { Movie } from "../types/movie";
import type { MovieFormValues } from "../schemas/movie.schema";
import {
  useGetMoviesQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
} from "../store/api";
import { MovieForm } from "../components/admin/MovieForm";
import { MovieTable } from "../components/admin/MovieTable";
import { CatalogSearch } from "../components/CatalogSearch";
import { Pagination } from "../components/Pagination";
import { Feedback } from "../components/Feedback";
import { useCatalogParams } from "../hooks/useCatalogParams";
import { getErrorMessage } from "../lib/api";

export function Admin() {
  const { search, page, setSearch, setPage } = useCatalogParams();
  const { currentData: result, isFetching, error, refetch } = useGetMoviesQuery({ search, page });
  const [createMovie] = useCreateMovieMutation();
  const [updateMovie] = useUpdateMovieMutation();
  const [deleteMovie, { isLoading: deleting }] = useDeleteMovieMutation();
  const [editor, setEditor] = useState<{ movie: Movie | null } | null>(null);
  const [notice, setNotice] = useState("");
  const [deleteError, setDeleteError] = useState("");

  async function save(values: MovieFormValues) {
    if (editor?.movie) {
      await updateMovie({ id: editor.movie._id, values }).unwrap();
    } else {
      await createMovie(values).unwrap();
    }
    setEditor(null);
    setNotice("Película guardada.");
  }

  async function remove(movie: Movie) {
    if (!window.confirm(`¿Eliminar “${movie.title}”? Esta acción no se puede deshacer.`)) return;
    setDeleteError("");
    setNotice("");

    try {
      await deleteMovie(movie._id).unwrap();
      if (editor?.movie?._id === movie._id) setEditor(null);
      if (result?.data.length === 1 && page > 1) setPage(page - 1);
      setNotice("Película eliminada.");
    } catch (failure) {
      setDeleteError(getErrorMessage(failure));
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Administrar catálogo</h1>
          <p className="muted">Agregá historias y mantené sus datos al día.</p>
        </div>
        <button
          className="button"
          onClick={() => {
            setEditor({ movie: null });
            setNotice("");
          }}
        >
          Agregar película
        </button>
      </div>
      <p role="status" className="notice">
        {notice}
      </p>
      {deleteError && (
        <p className="field-error" role="alert">
          {deleteError}
        </p>
      )}

      {editor && (
        <MovieForm
          key={editor.movie?._id ?? "new"}
          movie={editor.movie}
          onSave={save}
          onCancel={() => setEditor(null)}
        />
      )}

      <CatalogSearch key={search} initialSearch={search} onSearch={setSearch} />
      {isFetching && !result && <Feedback title="Cargando películas…" />}
      {error && (
        <Feedback title="No pudimos cargar las películas" error>
          <p>{String(error)}</p>
          <button className="button secondary" onClick={() => refetch()}>
            Reintentar
          </button>
        </Feedback>
      )}
      {!error && result && (
        <>
          {result.data.length > 0 ? (
            <MovieTable
              movies={result.data}
              busy={deleting}
              onEdit={(movie) => {
                setEditor({ movie });
                setNotice("");
                window.scrollTo({ top: 0 });
              }}
              onDelete={remove}
            />
          ) : (
            <Feedback title="No hay películas en esta página">
              <p>Agregá una película o cambiá la búsqueda.</p>
            </Feedback>
          )}
          <Pagination
            page={page}
            totalPages={result.meta.totalPages}
            onChange={setPage}
            disabled={isFetching || deleting}
          />
        </>
      )}
    </>
  );
}
