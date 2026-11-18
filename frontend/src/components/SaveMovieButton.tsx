import { useState } from "react";
import { Link } from "react-router";
import { useSession } from "../lib/auth-client";
import { useAddToWatchlistMutation, useGetWatchlistQuery } from "../store/api";
import { getErrorMessage } from "../lib/api";

export function SaveMovieButton({ movieId }: { movieId: string }) {
  const { data: session, isPending } = useSession();
  const {
    currentData,
    isFetching,
    error: loadError,
    refetch,
  } = useGetWatchlistQuery(
    {
      userId: session?.user.id ?? "",
      movieId,
    },
    { skip: !session },
  );
  const [add, { isLoading }] = useAddToWatchlistMutation();
  const [error, setError] = useState("");
  const saved = Boolean(currentData?.data.length);

  async function save() {
    setError("");
    try {
      await add(movieId).unwrap();
    } catch (failure) {
      setError(getErrorMessage(failure));
    }
  }

  return (
    <div className="save-movie">
      {isPending ? (
        <p role="status">Verificando sesión…</p>
      ) : !session ? (
        <Link
          className="button secondary"
          to="/login"
          state={{ from: { pathname: `/movies/${movieId}` } }}
        >
          Ingresar para guardar
        </Link>
      ) : loadError ? (
        <>
          <p className="field-error" role="alert">
            No pudimos consultar tu lista.
          </p>
          <button className="button secondary" onClick={() => refetch()}>
            Reintentar
          </button>
        </>
      ) : saved ? (
        <Link className="button secondary" to="/mi-lista">
          En mi lista · Ver y editar
        </Link>
      ) : (
        <button className="button" onClick={save} disabled={isLoading || isFetching}>
          {isLoading ? "Guardando…" : isFetching ? "Consultando tu lista…" : "Guardar en mi lista"}
        </button>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
